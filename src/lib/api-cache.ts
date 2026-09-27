import { apiUrl } from "@/lib/api-url";

/**
 * De-duplicated GET for public JSON endpoints.
 *
 * THE PROBLEM THIS SOLVES, straight out of the deployed function log:
 *
 *     00:17:23.94  GET /api/categories
 *     00:17:23.46  GET /api/categories
 *     00:17:22.55  GET /api/categories
 *     00:17:22.46  GET /api/categories
 *
 * Four requests for the same list inside one second, on one page view. The
 * footer asks for categories on every page, the products loader asks again, and
 * the contact form asks a third time — each with its own `fetch` in its own
 * effect, none aware of the others. Same story for /api/testimonials across the
 * home page and the product page.
 *
 * Two layers fix it:
 *   - an in-flight map, so simultaneous callers share ONE request
 *   - a short TTL cache, so a navigation moments later reuses the answer
 *
 * SERVER-SIDE THIS IS A PASS-THROUGH, deliberately. Module state in a warm
 * serverless instance is shared by every visitor that instance handles, so a
 * cache there would serve one person's response to the next. The CDN handles
 * caching on that side (see `cacheJson` in backend/api-core.ts).
 */
type Entry = { at: number; value: unknown };

const DEFAULT_TTL_MS = 30_000;

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path));
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}

export async function cachedJson<T>(path: string, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  if (typeof window === "undefined") return fetchJson<T>(path);

  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;

  const existing = inflight.get(path);
  if (existing) return existing as Promise<T>;

  const request = fetchJson<T>(path)
    .then((value) => {
      cache.set(path, { at: Date.now(), value });
      return value as unknown;
    })
    .finally(() => {
      inflight.delete(path);
    });

  inflight.set(path, request);
  return request as Promise<T>;
}

/** Forget one path, or everything. Call after a write that changes public data. */
export function invalidateJson(path?: string) {
  if (path) {
    cache.delete(path);
    return;
  }
  cache.clear();
}
