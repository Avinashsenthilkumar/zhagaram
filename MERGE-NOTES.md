# ZHAGARAM — three repos merged into one

Your teammate had split the project into `zhagaram-main` (the original
full-stack app), `zhagaram-frontend-main` and `zhagaram-backend-main`. This is
all three merged back into a single project, with the newest version of every
file kept.

## Where each file came from

| Part | Taken from | Why |
| --- | --- | --- |
| `src/`, `public/`, `scripts/`, `vite.config.ts`, `eslint.config.mjs` | **zhagaram-frontend-main** | Newest (24 Sep 22:13). Has the `apiUrl()` changes and the `ProductCard` / `ProductDetails` / `ProductReviews` rewrites. |
| `server/index.ts`, `server/auth.ts`, `server/db.ts`, `server/mailer.ts`, `prisma/`, `migrations/prisma/`, `prisma.config.ts` | **zhagaram-backend-main** | Newest (25 Sep 04:04). Has the multi-origin CORS list, the `SameSite=None` cookie fix and the Resend mailer. |
| `server/server.node.ts`, `server/routes/api/health.get.ts`, `server/virtual-grok-og-identity.d.ts`, `migrations/auth/`, `startup.sh`, `AGENTS.md`, `skills-lock.json`, `.agents/`, `.claude/`, `.windsurf/` | **zhagaram-main** | Existed only in the original monolith and was dropped during the split. |

Nothing was rewritten. Every file is byte-identical to the newest copy of
itself, except the five listed under "What I changed" below.

One file was **not** carried over: `ntent .srccomponentshomeProductCategories.tsx`
in `zhagaram-main` — a stray file created by a mistyped shell redirect. Its real
counterpart is `src/components/home/ProductCategories.tsx`, which is present.

## Running it

```bash
cp .env.example .env     # then fill in DATABASE_URL, JWT_SECRET, RESEND_API_KEY
npm install
npm run db:migrate:deploy
npm run db:seed

npm run dev:all          # API (:4000) + site (:3000) together
```

`npm run dev:all` is the new one-command script. The old commands still work
exactly as before if you prefer two terminals:

```bash
npm run dev              # site only  (vite, :3000)
npm run dev:api          # API only   (tsx server/index.ts, :4000)
```

Vite already proxied `/api` to `localhost:4000`, so nothing about how the
browser reaches the API changed.

## Deploying

Keep `VITE_API_URL` **empty**. Empty means `apiUrl()` returns a plain relative
path like `/api/products`, so the site calls the API on its own origin. That is
the main speed win of merging — see below. Only set `VITE_API_URL` if you ever
split the API onto a separate domain again.

`FRONTEND_URL` can also stay empty for the same reason: with one origin there is
no cross-origin request for CORS to approve.

---

# What I changed (5 files)

Everything else is untouched.

### 1. `public/` images — 26.1 MB → 6.8 MB (−74%)

This is the real reason the site felt slow. Photographs were saved as lossless
PNG: the hero was a 1.9 MB PNG, each banner 1.7–2.2 MB, and `favicon.png` was a
1377×1142 image weighing 1.2 MB for something the browser draws at 32 px.

Every image was recompressed **in place**. Same filenames, same extensions, same
formats — so no `<img src>`, no CSS `url()`, no sitemap entry needed editing.
Photographic PNGs got a 256-colour adaptive palette with dithering, JPEGs were
re-encoded at quality 80 progressive, and anything above 1920 px was downscaled.

I checked the result pixel by pixel: under 0.35% of pixels differ by more than
16/255, transparency is intact on every logo, and the hero is visually identical.

The script that did it is `scripts/optimize-images.mjs`, so you can re-run it
whenever someone adds new artwork:

```bash
npm run optimize:images              # optimise public/
npm run optimize:images -- --dry-run # report only, write nothing
npm run optimize:images -- --restore # undo (restores from public-original/)
```

It keeps originals in `public-original/` (gitignored). That folder is **not** in
this zip to keep the download small — your untouched originals are still in the
`zhagaram-frontend-main.zip` you sent me.

It needs Python with Pillow (`pip install pillow`). If Pillow is missing the
script prints instructions and exits 0, so it can never fail a build.

### 2. `server/index.ts` — gzip

Two lines added: `import compression from "compression"` and
`app.use(compression({ threshold: 1024 }))` directly above the existing
`express.json()` call.

`/api/products` and `/api/categories` return the full `description` field for
every row, which is mostly prose. Gzip typically takes 70–85% off that. It is
transport-level only — no route, payload, or status code behaves differently.

### 3. `vite.config.ts` — dev and build tuning

Additive properties only. No plugin was added, removed, or reordered.

- `server.warmup.clientFiles` — pre-transforms the router, root route, home
  route and components so the first dev page load isn't waiting on a cold
  transform chain.
- `optimizeDeps.include` — pre-bundles recharts, swiper, react-hook-form,
  date-fns, lucide-react and friends at startup instead of discovering them
  mid-session and triggering a full page reload.
- `build.cssMinify: "lightningcss"` — uses the `lightningcss` already in your
  devDependencies. Faster minify, smaller CSS than the esbuild default.
- `build.reportCompressedSize: false` — skips a gzip pass over every chunk at
  the end of each build that only existed to print a number.

### 4. `package.json` — merged

Union of all three dependency lists, so nothing any of the three projects
imported went missing. `resend` (backend-only) and `nodemailer` (frontend/main)
are both present. Added `compression` + `@types/compression`.

Scripts are the union too. `build` uses the monolith's version
(`prisma generate && …`) because Prisma now lives in this project, and
`postinstall: prisma generate` came from the backend. Two new ones: `dev:all`
and `optimize:images`.

`package-lock.json` was deleted — the three lockfiles described three different
dependency trees and none of them matched the merged `package.json`. Run
`npm install` once and commit the lockfile it generates.

### 5. `.env.example` and `.gitignore` — merged

Every variable from all three files in one place, with notes on which ones
should now stay empty. `.gitignore` is the union of all three, plus
`public-original/`.

---

# Things I left alone but you should know about

**`server/mailer.ts` throws at import time** if `RESEND_API_KEY` is missing:

```ts
if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not configured.");
}
```

Because this runs at module load rather than inside `sendEmail()`, the entire
API fails to boot without that key — not just the enquiry form. This is your
teammate's newest code so I left it exactly as written, but set `RESEND_API_KEY`
before starting, or move the check inside `sendEmail()`.

**`src/lib/api.ts` and `src/lib/api-url.ts` are duplicates.** Same two
functions, different files, and different components import from each. Harmless,
but worth collapsing into one when you next touch that area.

**Cookies are set with `SameSite=None` in production.** That was needed when the
frontend and backend were on different domains. Now that they share an origin,
`SameSite=Lax` would be safer against CSRF. I didn't change it because it is a
security-behaviour change and should be your call.

**Remaining speed work, in the order I'd do it:**

1. Product and category images live in Postgres as base64 `@db.Text`. Every
   cache miss costs a DB round trip plus a base64 decode. Moving them to object
   storage or a CDN would be the next big win.
2. `Footer`, `Testimonials` and the catalog helpers call `fetch` directly inside
   `useEffect`. `@tanstack/react-query` is already a dependency but unused for
   these — wiring them through it would dedupe the repeated `/api/categories`
   calls the footer makes on every route change.
3. `/api/products` returns the full `description` for every product even though
   the listing only renders `shortDescription`. Dropping `description` from
   `publicProductSelect` would shrink that response a lot, but it changes the
   API contract, so I left it.

---

# Verification run on the merged tree

I couldn't run `npm install` or `tsc` here (no network in this environment), so
I verified the merge statically instead. All four checks pass:

**1. Import graph — 168 source files scanned, 0 broken imports.**
Every relative and `@/`-aliased import across `src/`, `server/`, `scripts/` and
`prisma/` resolves to a file that exists in the merged tree. This is the check
that would have caught anything the frontend/backend split left behind.

Four imports looked unresolved at first and are all fine:
`../styles.css?url` and `../../scripts/install-page.html?raw` are Vite query
suffixes on files that exist; `virtual:grok-og-identity` is a virtual module
supplied by `scripts/grok-pwa-plugin.mjs`; and `h3` in
`server/routes/api/health.get.ts` comes in through Nitro — it wasn't declared in
your original `zhagaram-main` either, so that's pre-existing, not something the
merge introduced.

**2. Every package imported anywhere is present in `package.json`.**

**3. Public assets — 21 distinct paths referenced from `src/`, 0 missing.**
Confirms the image recompression didn't break a single reference.

**4. `src/routeTree.gen.ts` is in sync** — 15 route files on disk, the same 15
imported by the generated tree. Nothing stale, nothing orphaned.

## Still worth a look: unreferenced images

10 images in `public/` aren't referenced from anywhere in `src/`, totalling
1.79 MB after optimisation (they were about 7 MB before):

```
public/images/spice/spice-banner.png        public/images/common/image-30.png
public/images/products/spices.jpg           public/image (30).png
public/images/products/other-products.jpg   public/images/quality-banner.png
public/images/hero/hero.jpg                 public/images/legal-banner.png
```

I did **not** delete them — some may be referenced from the database (category
and product rows can hold image paths) or kept deliberately. The two
`public/__grok/install/assets/` files are used by the PWA install page, so leave
those alone. Worth checking the other eight when you have a moment.
