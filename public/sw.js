/* ZHAGARAM EXIM service worker.
 *
 * Three caching strategies, picked per request type:
 *
 *   App shell + static assets  -> stale-while-revalidate
 *       Instant paint from cache, refreshed quietly in the background.
 *
 *   Product / category images  -> stale-while-revalidate
 *       These come out of Postgres as base64 and are the slowest thing on the
 *       site, so the cached copy paints instantly. The URLs are stable, so the
 *       background refresh is what lets a replaced image ever appear.
 *
 *   API JSON (GET)             -> network-first, cache as fallback
 *       Always fresh when online; the last good response is served if the
 *       network is slow or gone. Writes (POST/PATCH/DELETE) are never touched.
 *
 * Bump CACHE_VERSION to invalidate everything after a deploy.
 */

const CACHE_VERSION = "v2";
const SHELL_CACHE = `zhagaram-shell-${CACHE_VERSION}`;
const IMAGE_CACHE = `zhagaram-images-${CACHE_VERSION}`;
const API_CACHE = `zhagaram-api-${CACHE_VERSION}`;

const IMAGE_MAX_ENTRIES = 120;
const API_MAX_ENTRIES = 60;

const PRECACHE = [
  "/",
  "/logo.png",
  "/logo-mark.png",
  "/favicon.png",
  "/icons/icon-192.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll rejects the whole batch if one URL 404s, so add them
      // individually and tolerate misses.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, IMAGE_CACHE, API_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Keep a cache from growing without bound (rough FIFO trim). */
async function trim(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
}

async function networkFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
      trim(cacheName, maxEntries);
    }
    return response;
  } catch (error) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).then(() => {
          if (maxEntries) trim(cacheName, maxEntries);
        });
      }
      return response;
    })
    .catch(() => undefined);

  // A cache hit answers immediately; the refresh keeps running in the background.
  if (hit) {
    void network;
    return hit;
  }
  const response = await network;
  return response || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never interfere with writes, auth, or anything cross-origin.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/auth")) return;
  if (url.pathname.startsWith("/api/admin")) return;
  if (url.pathname.startsWith("/__grok")) return;

  // Product and category images out of the database.
  //
  // These URLs are STABLE (/api/products/<slug>/image), so a pure cache-first
  // entry never expires: replacing a product photo in the admin panel left every
  // returning visitor looking at the old one forever. Stale-while-revalidate
  // keeps the instant paint from cache and picks the new bytes up in the
  // background, so the change lands on the next view instead of never.
  if (/^\/api\/(products|categories)\/[^/]+\/image$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, IMAGE_MAX_ENTRIES));
    return;
  }

  // Public API reads.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE, API_MAX_ENTRIES));
    return;
  }

  // Static files shipped with the site.
  if (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font"
  ) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  // HTML navigations: network first so content is never stale, cached "/" as
  // the offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(request)) || (await cache.match("/")) || Response.error();
      }),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
