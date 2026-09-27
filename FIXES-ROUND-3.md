# Round 3 — pre-deployment fixes

Everything below was found by reading the merged codebase against what Vercel
actually does at build and request time. Each entry says what was wrong, how it
showed up, and what changed.

---

## 1. Server-rendered product pages always showed the sample catalogue

**Severity: this was the big one.**

`src/routes/products/index.tsx` and `src/routes/products/$slug.tsx` load the
catalogue in a route `loader`, and a TanStack Start loader runs **on the server**
for the first request. `src/lib/catalog-api.ts` called:

```ts
fetch(apiUrl("/api/products"))   // apiUrl() returned "/api/products"
```

Node's `fetch` cannot take a relative URL:

```
TypeError: Failed to parse URL from /api/products
```

`catalog-api.ts` catches every error and returns the six placeholder products
from `src/data/products.ts`, so nothing ever looked broken. The consequences on
the deployed site:

- `/products` rendered the static sample catalogue on every cold load, whatever
  was in the database. `staleTime: 30_000` then held that payload for the first
  30 seconds of the visit.
- `/products/<slug>` for a product that exists **only** in the database threw
  `notFound()` during SSR — a hard 404 page, and a 404 status to crawlers.

**Fixed** in `src/lib/api-url.ts`: `apiUrl()` now returns an absolute URL when it
runs on the server, resolving the origin from `APP_URL` / `PUBLIC_SITE_URL`, then
`VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`, then `http://127.0.0.1:$PORT`
for local `npm run dev:api`.

Two things were deliberate:

- **`apiResourceUrl()` still returns relative paths.** It feeds image `src`
  attributes, which the browser resolves. Making those absolute would have
  pinned every product image to one hostname and broken images on any other
  domain.
- **Every `process.env` read is guarded** by `typeof process !== "undefined"` and
  a `window` check. An unguarded `process.env` that reaches the browser bundle is
  a `ReferenceError` — which is a blank page, the exact failure this project
  already spent two rounds chasing.

Set `APP_URL` in Vercel and none of the fallbacks are used.

## 2. `npm run db:seed` could never have worked

`prisma/schema.prisma` generates to `../src/generated/prisma` with
`provider = "prisma-client"`, so the `@prisma/client` package ships only the
runtime — not a generated client. Every file imports from the generated path
except `prisma/seed.ts`, which imported:

```ts
import { PrismaClient } from "@prisma/client";
```

That fails before it opens a connection. Since seeding is what creates the admin
account, admin login was unreachable on a fresh database.

**Fixed:** imports from `../src/generated/prisma/client`, and now prefers
`DIRECT_URL` over `DATABASE_URL` (matching `prisma.config.ts`), because seeding
through a transaction-mode pooler is unreliable.

`prisma/seed.ts` sits outside `tsconfig.json`'s `include`, which is why
`npm run typecheck` never caught this.

## 3. Migrations now run on deploy

The previous flow needed you to remember `npm run db:migrate:deploy` from your
own machine, and forgetting it is exactly what made `/api/products` answer 500.

**Added** a `vercel-build` script (Vercel prefers it over `build`):

```
node scripts/prisma-migrate-deploy.mjs && npm run build
```

`scripts/prisma-migrate-deploy.mjs` was hardened: it skips when no database URL
is configured, skips on `SKIP_DB_MIGRATE=1` (your escape hatch, settable from the
Vercel UI with no code change), warns when `DIRECT_URL` is missing, prefers
`DIRECT_URL` for DDL, and no longer re-raises a signal at its own pid.

Seeding stays manual — it writes the admin account.

## 4. Prisma opened far too many Postgres connections

`backend/db.ts` created the `pg` pool with the default `max` of 10, and cached the
client on `globalThis` **only outside production**. On Vercel every concurrent
invocation is its own module instance, so 10 warm functions meant up to 100
connections against a database that typically allows far fewer — the failure mode
is intermittent 500s under light traffic, which reads like a flaky database.

**Fixed:** `max: 1` on Vercel (a function serves one request at a time), a 10s
idle timeout, a 10s connection timeout, and the client cached on `globalThis` in
every environment. A missing `DATABASE_URL` now logs one clear line instead of
surfacing as a `pg` error about connecting to `localhost:5432`.

## 5. Guest reviews were anonymous in the moderation panel

Reviews do not require an account, so most rows have `user: null` and the name
the visitor typed lives in `reviewerName`. `src/routes/admin/reviews.tsx` left
that field out of its type and rendered `review.user?.name || "Verified
customer"` — so **every** guest review showed as "Verified customer" and you
could not tell submissions apart.

**Fixed:** `reviewerName` added to the type and used first; guest rows are marked
as such.

Related: `/api/admin/reviews` built the product thumbnail from the legacy
`images[0]` column only. Products uploaded through the admin panel write
`imageData` / `imageMimeType`, not `images`, so those rows showed a letter
placeholder. It now goes through `serializeProduct`, the same path the public
site uses.

## 6. A replaced product image was cached forever

`public/sw.js` served `/api/products/<slug>/image` **cache-first** with no
expiry. Those URLs are stable, so once a visitor had seen a photo they would
never see a replacement — uploading a new image in the admin panel appeared to
do nothing for anyone who had visited before.

**Fixed:** those requests use stale-while-revalidate, so the cached copy still
paints instantly and the new bytes land on the next view. `CACHE_VERSION` bumped
to `v2` so existing visitors drop the old cache-first entries. The unused
`cacheFirst` helper was removed.

## 7. `robots.txt` and `sitemap.xml` were both invalid

- `robots.txt` had `Sitemap: /sitemap.xml`. That directive **must** be an
  absolute URL; a relative one is silently ignored, so the sitemap was never
  read.
- `sitemap.xml` used `<loc>/about</loc>`. The sitemaps.org protocol requires
  fully qualified URLs, so the whole file was invalid and none of the pages were
  ever submitted.

**Fixed:** absolute URLs on both, using the host in `src/data/site.ts`. `robots.txt`
also now disallows `/admin`, `/login`, `/403` and `/api/`. If you launch on a
`*.vercel.app` hostname rather than `zhagaramexim.com`, change the host in both
files and in `src/data/site.ts`.

## 8. JSON-LD used relative URLs

`src/lib/seo.ts` emitted `image: "/api/products/rice/image"` and breadcrumb
`item: "/products/rice"`. Search engines discard relative URLs in structured
data, so the rich results this markup exists for were never eligible.

**Fixed:** an `absoluteUrl()` helper resolves them against `siteConfig.url`, and
`organizationJsonLd` now carries a `url`.

## 9. Enquiry emails named products by slug

The quote form submitted the product **slug**, and that string goes straight into
the notification email. Your team was reading "edible-oils" and
"other-products".

**Fixed:** the option value is the readable name, in both the static list
(`src/lib/enquiry.ts`) and the database-driven one
(`src/components/contact/ContactForm.tsx`).

## 10. Two copies of the API URL helpers

`src/lib/api.ts` and `src/lib/api-url.ts` were byte-identical, and different
files imported different copies — `src/routes/admin/reviews.tsx` used one,
everything else the other. Fix #1 would have landed in one and silently skipped
the other's callers.

**Fixed:** `api-url.ts` is the single implementation; `api.ts` re-exports it.

## 11. Both `api()` helpers threw away their own headers

```ts
fetch(apiUrl(path), {
  credentials: "include",
  headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  ...options,          // <- re-applies options.headers over the merged object
});
```

Harmless today because no caller passes `headers`, but it is a trap: the first
call that does would lose the Content-Type and get a 400 from Zod. Spread order
fixed in `src/routes/admin.tsx` and `src/routes/admin/reviews.tsx`.

## 12. Lint config ignored

`src/generated/**` added to `eslint.config.mjs` ignores — it is rewritten by
`prisma generate` on every install.

---

## What was checked and found correct

- **Every local import resolves** — all 186 `.ts` / `.tsx` / `.mjs` files parse
  with no syntax errors, and every relative and `@/` specifier points at a file
  that exists.
- **Every bare import is a declared dependency** — nothing imports a package
  missing from `package.json`.
- **No module-scope browser globals** outside `src/lib/db.ts`'s deliberate
  server-only guard, so nothing crashes during SSR.
- **Migrations agree with `prisma/schema.prisma`** — the guest-review migrations
  match the model, and no migration re-creates an index the init migration
  already made, so `prisma migrate deploy` is clean on a fresh database.
- **Prisma 7 bundles cleanly on Vercel.** The generated client loads its query
  compiler from `query_compiler_fast_bg.postgresql.wasm-base64.mjs` — WASM
  embedded as base64 in a JS module — so there is no binary engine file for
  Nitro to fail to copy.
- **The service worker does not trap a bad deploy.** Navigations are
  network-first, `skipWaiting()` + `clients.claim()` means a new worker takes
  over at once, and `?sw=off` still tears everything down.
- **`server/middleware/grok-pwa.ts` does no request-time filesystem work.**
  `renderWebManifest` is pure; the only `readFileSync` in
  `grok-pwa-shared.mjs` is inside a try/catch used at build time.
- **The Express / Nitro split is sound.** `backend/` stays outside Nitro's
  scanned directory, `server/routes/api/[...].ts` feeds the same
  framework-agnostic handlers, and `app.listen()` is guarded.
- **All 15 routes are present in `src/routeTree.gen.ts`.**

## Still open — read before you deploy

1. **`npm install` could not run in the environment these fixes were made in**
   (the npm registry was blocked by network policy), so `npm run typecheck` and
   `npm run build` have **not** been executed against them. Run both locally
   before deploying — see the checklist below.

2. **`npm test` has 14 pre-existing failures, all in the app-builder scaffolding
   harness, none in the website.** They break down as:
   - `scripts/grok-pwa-plugin.test.mjs` (6) — assert the streaming `<head>`
     injector that was deliberately removed in round 2 to fix the blank page.
     These tests are stale, not a defect.
   - `scripts/with-app-env.test.mjs` (4) and `scripts/brand-check.test.mjs` (3) —
     need a `.grok/app-env.json` and a `.grok/skills/og/` directory that this
     project does not ship. **Do not create `.grok/app-env.json` to make them
     pass** — it carries `VITE_AUTH_ENABLED` and would change how the app builds.
   - `scripts/write-atomic.test.mjs` (1) — same missing `.grok/skills` fixture.

   Nothing in this set runs during `npm run build`, so none of it can affect the
   deployment. Worth deleting or rewriting as a separate cleanup.

3. **`prisma/seed.ts` is outside `tsconfig.json`'s `include`**, which is how bug
   #2 hid. Adding `"prisma"` to `include` would catch the next one; it was left
   alone here only because the change could not be verified with a typecheck.

## Verify locally before you push

```bash
npm install
npm run typecheck        # must be clean
npm run build            # must reach "build completed"
npm run preview          # then open the printed URL

# with a real DATABASE_URL / DIRECT_URL in .env:
npm run db:migrate:deploy
npm run db:seed
npm run dev:all          # site + API together
```

Then the post-deploy order in `DEPLOY-VERCEL.md`: `/api/health`, `/api/products`,
the home page, `/login` → `/admin`, `/contact`.

---

# Round 3b — errors `npm run typecheck` found

`npm run build` succeeded before any of these were fixed. Vite/Rolldown strips
types without checking them, so a missing function is not a build error — which
is exactly how #13 shipped.

## 13. The admin panel could not create or edit a product at all

`src/routes/admin.tsx` called two functions that **were never defined anywhere**
(`TS2304: Cannot find name`):

- `splitValues()` — used by `submitProduct()` to turn the comma-separated
  images/features fields into arrays. Every product save threw a
  `ReferenceError` before the request left the browser. `runMutation` catches
  it, so the only symptom was the generic "Unable to save changes."
- `mimeFromDataUrl()` — used by `editProduct()`. That one runs straight from an
  `onClick` with no try/catch, so pressing **Edit** on a product threw and the
  modal never opened.

Categories were unaffected, which is why the panel looked half-working rather
than broken.

**Fixed:** both implemented next to the form state they serve. `splitValues`
splits on commas and newlines, trims, and drops blanks (the server rejects empty
strings in those arrays); `mimeFromDataUrl` pulls the media type out of a
`data:` URL and returns `""` for anything else, which is what the existing
`imageData ? {...}` guards already expect.

## 14. `server/routes/api/[...].ts` — Response body type

`CapturedBody` is `string | Uint8Array | null`. TypeScript's DOM `BodyInit`
wants an `ArrayBufferView` over a non-shared `ArrayBuffer`, while a plain
`Uint8Array` is `Uint8Array<ArrayBufferLike>`, which also admits
`SharedArrayBuffer`. A nominal mismatch that cannot occur here — the only
`Uint8Array` ever stored comes from `Buffer.from(...)` in `sendStoredImage`.
Narrow cast, with the reasoning in a comment.

## 15. `src/components/layout/BottomTabBar.tsx` — union property access

The `tabs` array is `as const` with `primary: true` on one entry only, so four
members of the element union have no `primary` property and every `tab.primary`
was a `TS2339`. `primary` is now declared on all five entries, which keeps the
literal `href` values `<Link to=...>` needs instead of widening them to `string`.

---

# Stage 2 — performance

Measured from the deployed function log, not guessed at.

## 16. The same list was fetched 2-4 times per page view

```
00:17:23.94  GET /api/categories
00:17:23.46  GET /api/categories
00:17:22.55  GET /api/categories
00:17:22.46  GET /api/categories
```

Four requests for one list inside a second. The footer asks for categories on
every page, the products loader asks again, the contact form a third time —
each with its own `fetch` in its own effect, none aware of the others.
`/api/testimonials` had the same problem across the home and product pages.

**Fixed:** `src/lib/api-cache.ts` — an in-flight map so simultaneous callers
share one request, plus a 30s TTL cache so a navigation moments later reuses the
answer. Wired into the footer, the testimonials slider, the product reviews
block and `catalog-api.ts`.

It is a deliberate **pass-through on the server**: module state in a warm
serverless instance is shared by every visitor that instance handles, so caching
there would risk serving one person's response to the next. The CDN covers that
side instead (#17).

## 17. Every image request hit the function and the database

Stored images carried `max-age=3600` and no `s-maxage`, so Vercel's CDN cached
nothing. Every thumbnail on every visit was a function invocation plus a
Postgres query returning up to 3 MB of base64.

The reason the lifetime was short: `/api/products/rice/image` never changes, so
a long cache would have pinned a replaced photo.

**Fixed:** image URLs now carry `?v=<updatedAt>`, so editing a product mints a
new URL, and the bytes behind any given URL are immutable in practice. That
makes a long cache safe:

```
public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800
```

`s-maxage` is the one that matters — repeat requests are served by the CDN
without waking the function or touching the database. No `immutable`, so a URL
that somehow lost its version still heals within the day instead of sticking
forever.

## 18. Public JSON was uncacheable; admin JSON was not protected from caching

`/api/categories`, `/api/products` and `/api/testimonials` sent no cache headers
at all, so every page view was a fresh function call.

**Fixed:** those three now send `s-maxage=60`, and `/api/settings` `s-maxage=30`
(shorter, because a saved logo should appear quickly). `max-age=0` keeps the
browser revalidating, so the CDN absorbs the traffic without anyone seeing
stale data for long.

The other half matters more: **everything under `/api/admin` and `/api/auth` now
sends `no-store, private`**, set once at the top of `handleApiRequest`. Those
responses carry session state and admin data, and a shared CDN holding one
admin's dashboard and serving it to the next visitor is the failure this
forecloses. It was never observed — there were simply no headers either way,
which is not something to leave to chance.

**Trade-off worth knowing:** adding a product can take up to 60 seconds to
appear on the public site. Lower the `cacheJson(res, 60)` values in
`backend/api-core.ts` if you want that faster.
