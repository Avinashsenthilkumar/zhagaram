/**
 * Deployed-app (Nitro) half of the platform PWA chrome. Auto-registered as
 * global h3 middleware because vite.config.ts sets `serverDir: "./server"`.
 *
 * WHAT CHANGED, AND WHY
 * ---------------------
 * This middleware used to pipe every HTML document through a TransformStream
 * that injected platform PWA + OG <head> tags (`injectHeadStreaming` ->
 * `createHeadInjector` -> `injectGrokPwaHead`). On the deployed Vercel function
 * that transform corrupted the response body, and a corrupt HTML document is a
 * blank page. Measured on zhagaram-new.vercel.app:
 *
 *   /robots.txt                static CDN file        -> served correctly
 *   /sitemap.xml               static CDN file        -> served correctly
 *   /?install=1&platform=ios   HTML returned DIRECTLY -> served correctly
 *   /                          HTML through injector  -> corrupt / unreadable
 *   /about                     HTML through injector  -> corrupt / unreadable
 *
 * Same function, same content-type, same compression -- the injector was the
 * only difference. It also reaches `readFileSync`/`existsSync` on
 * `src/lib/og/site.json` and `public/og.*`, paths that do not exist inside the
 * serverless function (this file's own original comment noted that), so it was
 * doing filesystem work at request time that can never succeed there.
 *
 * Nothing of value is lost by removing the injection. The app now ships its own
 * real PWA identity, which is strictly better than the injected placeholders:
 *
 *   public/manifest.webmanifest   name, icons, theme colour, app shortcuts
 *   public/icons/*                192 / 512 / maskable / apple-touch
 *   src/routes/__root.tsx         title, description, theme-color,
 *                                 apple-mobile-web-app-* iOS tags
 *
 * The two endpoints below are kept because they answer directly with their own
 * Response and are verified working:
 *
 * - `/__grok/manifest.webmanifest` -> per-app-named manifest
 * - `?install=1&platform=…` on a document path -> Home Screen tutorial
 *
 * HTML documents are now passed through untouched.
 */
import installPageTemplate from "../../scripts/install-page.html?raw";
import {
  acceptsHtml,
  isDocumentPath,
  isInstallQuery,
  renderInstallPageHtml,
  renderWebManifest,
} from "../../scripts/grok-pwa-shared.mjs";

interface GrokPwaEvent {
  url: URL;
  req: { method: string; headers: Headers };
}

function requestHost(event: GrokPwaEvent): string {
  return (
    event.req.headers.get("x-forwarded-host") ?? event.req.headers.get("host") ?? event.url.host
  );
}

export default async function grokPwaMiddleware(
  event: GrokPwaEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const method = (event.req.method ?? "GET").toUpperCase();
  if (method !== "GET") return next();

  const path = event.url.pathname;
  const urlWithQuery = path + event.url.search;

  if (path === "/__grok/manifest.webmanifest" || path === "/__grok/manifest.json") {
    return new Response(renderWebManifest(requestHost(event)), {
      headers: {
        "content-type": "application/manifest+json; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  }

  if (
    isInstallQuery(urlWithQuery) &&
    isDocumentPath(path) &&
    acceptsHtml(event.req.headers.get("accept"))
  ) {
    const html = renderInstallPageHtml(installPageTemplate, {
      host: requestHost(event),
      url: urlWithQuery,
    });
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  }

  // Pass every document straight through. Do NOT wrap the SSR stream.
  return next();
}
