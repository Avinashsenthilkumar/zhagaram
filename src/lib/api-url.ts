/**
 * How the app addresses its own API.
 *
 * The site and the API ship from ONE origin now (see DEPLOY-VERCEL.md), so in
 * the browser a bare `/api/...` path is correct and `VITE_API_URL` stays empty.
 *
 * SERVER-SIDE RENDERING IS THE CATCH, and it was a real bug:
 * `src/routes/products/index.tsx` and `src/routes/products/$slug.tsx` fetch the
 * catalogue from a route `loader`, and a loader runs on the server for the
 * first request. Node's `fetch` cannot take a relative URL:
 *
 *     fetch("/api/products")
 *     -> TypeError: Failed to parse URL from /api/products
 *
 * `src/lib/catalog-api.ts` catches every error and returns the static sample
 * catalogue, so nothing looked broken -- the deployed product pages simply
 * rendered the six placeholder products from `src/data/products.ts` on every
 * cold load, whatever was in the database. `staleTime: 30_000` then kept that
 * SSR payload for the first half minute of the visit.
 *
 * `apiUrl` now returns an ABSOLUTE url when it runs on the server, so the
 * loader reaches the real API and SSR serves real data.
 *
 * Every `process.env` read is behind `typeof process` and a `window` check, so
 * this module stays safe if a bundler ever ships it to the browser -- an
 * unguarded `process.env` there is a `ReferenceError`, which means a blank page.
 */
const configuredBase = String(import.meta.env.VITE_API_URL ?? "").trim();

export const API_BASE_URL = configuredBase.replace(/\/+$/, "");

function isServer(): boolean {
  return typeof window === "undefined";
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Origin to prefix onto `/api/...` during SSR, in order of trust:
 *
 *   1. APP_URL / PUBLIC_SITE_URL   what the deployer actually configured
 *   2. VERCEL_PROJECT_PRODUCTION_URL  the project's stable production domain
 *   3. VERCEL_URL                  this specific deployment
 *   4. the local API server        `npm run dev:api`, port from PORT
 *
 * `VERCEL_URL` is last of the hosted options because on a preview deployment
 * with Deployment Protection on it answers 401; the production domain does not.
 */
function serverOrigin(): string | null {
  if (typeof process === "undefined" || !process.env) return null;
  const env = process.env;

  const explicit = env.APP_URL || env.PUBLIC_SITE_URL;
  if (explicit && explicit.trim()) {
    const value = trimTrailingSlash(explicit.trim());
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  const productionHost = env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionHost && productionHost.trim()) {
    return `https://${trimTrailingSlash(productionHost.trim())}`;
  }

  const deploymentHost = env.VERCEL_URL;
  if (deploymentHost && deploymentHost.trim()) {
    return `https://${trimTrailingSlash(deploymentHost.trim())}`;
  }

  // Local development: the Express API from `npm run dev:api`.
  const port = env.PORT && env.PORT.trim() ? env.PORT.trim() : "4000";
  return `http://127.0.0.1:${port}`;
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (API_BASE_URL) return `${API_BASE_URL}${normalizedPath}`;

  if (isServer()) {
    const origin = serverOrigin();
    if (origin) return `${origin}${normalizedPath}`;
  }

  return path;
}

export function apiResourceUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  // Image URLs are rendered into `src` attributes and resolved by the browser,
  // so they must stay relative even when this runs during SSR. Only prefix them
  // when a separate API origin is explicitly configured.
  if (!value.startsWith("/api/")) return value;
  return API_BASE_URL ? `${API_BASE_URL}${value}` : value;
}
