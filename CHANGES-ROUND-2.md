# Round 2 — logo, app feel, quote options, map, speed, loaders

Everything you asked for, in the order you listed it.

---

## 1. New logo

Your logo file is now the site's brand mark, and a matching icon set was
generated from it.

| File | Purpose |
| --- | --- |
| `public/logo.png` | Header, footer, admin header (52 KB) |
| `public/logo-mark.png` | Spinner and splash |
| `public/images/common/mobile-logo.png` | Kept so existing references still work |
| `public/favicon.png` | Browser tab (**was 1.2 MB, now 8.9 KB**) |
| `public/icons/icon-192.png`, `icon-512.png` | Home screen icon |
| `public/icons/icon-maskable-512.png` | Android adaptive icon (extra padding so nothing is cropped) |
| `public/icons/apple-touch-icon.png` | iPhone / iPad home screen |

**ZHAGARAM EXIM LLP sits centred underneath the mark.** `Logo.tsx` now stacks
them: mark on top, name below, both centre-aligned.

The name is real text, not part of the PNG. That keeps it razor sharp on every
screen, lets it scale with the layout, and means Google and screen readers can
read your company name instead of seeing a picture. It also keeps the image
file small.

## 2. Feels like an app on mobile

Installable, full-screen, and navigable with your thumb:

- **`public/manifest.webmanifest`** — standalone display, portrait, your icons,
  navy theme colour, and three app shortcuts (Get a Quote / Products / Contact)
  that appear when you long-press the home-screen icon.
- **Bottom tab bar** (`BottomTabBar.tsx`) — Home, Products, **Quote** (raised
  centre button), Process, Contact. Phones only; the normal header takes over
  from `lg` up. This is the single biggest thing that makes a site read as an
  app: destinations under the thumb instead of behind a hamburger.
- **`public/sw.js`** — a service worker, covered under speed below.
- **Install prompt** — a card offering "Add to Home Screen", shown 6 seconds in
  so it does not interrupt on arrival. Dismissing it is remembered.
- **Boot splash** (`AppSplash.tsx`) — your logo with a loading bar, once per
  session, the way a native app opens.
- **iOS full screen** — `apple-mobile-web-app-capable` and a translucent status
  bar, since iOS ignores the manifest for this.
- **Notch and home-indicator safe areas** — `viewport-fit=cover` plus
  `env(safe-area-inset-*)` so nothing hides under the system bars.
- **No web tells** — no rubber-band overscroll, no blue tap flash, no long-press
  callout menu, and a subtle press-scale on touch. Text in paragraphs, headings
  and inputs stays selectable so people can still copy your address.

To install: open the site in Chrome or Safari on your phone, then "Add to Home
Screen". It opens with no browser chrome at all.

## 3. Get a Quote now asks which form you want

`/get-a-quote` opens on a choice screen with two cards:

- **I want to buy** — customer enquiry (pricing, quantity, destination)
- **I want to supply** — supplier enquiry (your products, available quantity)

Picking one loads that form. The choice is stored in the URL
(`/get-a-quote?type=supplier`), which is better than a popup: you can link
straight to either form, share it, and the browser back button returns to the
choice instead of leaving the page. There is also a "Choose a different enquiry
type" link above each form.

## 4. Contact page: form out, real map in

The enquiry form is gone from `/contact` — both forms now live on the quote page
above, so there is one place to send an enquiry instead of two.

In its place is a real Google map of:

> 2E, Perumal Street, South Udayarpalayam, Attur, Salem - 636102, Tamil Nadu, India

with the address written out beside it and a **Get directions** button that opens
Google Maps.

Two implementation notes:

- The map uses the **keyless** `maps.google.com/maps?output=embed` endpoint, so
  it works right now with no API key, no billing account and no quota. If you
  later want Street View or custom pin styling, swap in the Maps Embed API and
  put the key in `VITE_GOOGLE_MAPS_KEY`.
- The iframe only mounts **once you scroll to it**. A Maps embed pulls roughly a
  megabyte of scripts and tiles; loading it eagerly would undo the speed work
  below.

The address now lives in one place, `src/data/site.ts` (`officeAddress`), and
feeds the map, the directions link, the contact list and the page description.
Change it there and it updates everywhere.

## 5. Why adding and deleting products was slow

I found it, and it was worse than it looked.

**The server was sending every product's image, twice, as text.**

`/api/admin/products` ran `findMany({ include: { category: true } })` with no
`select`. That returns every column — including `imageData`, the base64 blob of
up to 3 MB per product. Then `serializeProduct(product, true)` added a *second*
copy of the same bytes as a data URL.

With ten products at 3 MB each, opening the admin panel or saving one field
meant downloading roughly **60 MB of JSON**. Every time.

Both admin list endpoints now select explicit columns and return an image *URL*
(`/api/products/<slug>/image`), exactly like the public site already did.
Create, update and delete responses strip the blob too, via a new
`withoutImageData()` helper.

**The browser was uploading full-resolution phone photos.**

`ImageField` read the file straight to base64 and posted it. A 4 MB photo became
~5.4 MB of base64 in the request body and another 5.4 MB in the database row.

`src/lib/image-compress.ts` now resizes to 1600px and re-encodes as WebP (JPEG
on older Safari) **in the browser, before upload**. A 4 MB photo becomes roughly
200 KB — over 90% smaller — with no visible difference at the sizes the site
renders. The field shows you the saving as it works. SVG and GIF pass through
untouched, since a canvas round trip would rasterise vectors and flatten
animation.

**Images now load lazily.**

New `SmartImage` component: `loading="lazy"` so off-screen pictures never
compete with the hero, `decoding="async"` so decoding a large JPEG doesn't block
the page, fixed `width`/`height` so the layout doesn't jump as images arrive,
and a shimmer placeholder while they load. Fifteen other images across the site
got lazy loading too. The hero stays eager and high-priority — it's what you see
first.

**Repeat visits are cached.**

`public/sw.js` uses three strategies: product images are cache-first for 30 days
(seen once, never fetched again), public API reads are network-first with the
last good response as fallback, and static assets are
stale-while-revalidate. Writes, `/api/auth` and `/api/admin` are never touched —
the admin panel always talks to the live server.

Combined with the 26 MB → 6.8 MB image pass from the merge, the site should feel
like a different product.

## 6. Loading animation with your logo

`LogoSpinner` — your mark inside a ring that sweeps from gold to navy. Three
sizes, wired in everywhere:

- Every route transition (`defaultPendingComponent` in `router.tsx`)
- Products grid, category carousel, testimonials
- Admin dashboard load and the image optimiser
- Contact form and review form submit buttons
- The contact map while it loads

One deliberate choice: **the ring spins, the logo doesn't.** Rotating the mark
puts the ship and the plane upside down, which reads as broken rather than busy.
The logo pulses gently instead.

The spinner only appears after 220ms of waiting — flashing one for 80ms looks
worse than showing nothing.

---

# One file of yours I changed, and why

`scripts/grok-pwa-shared.mjs` injects PWA head tags, and its guard only checked
for the `/__grok/` paths:

```js
if (key === "manifest") return !next.includes('href="/__grok/manifest.webmanifest"');
```

Since our manifest is at `/manifest.webmanifest`, that test passed and the
plugin would have injected a **second** `rel="manifest"` link. Injected tags go
right after `<head>`, so the wrong one would have come first and won — replacing
your app name, icons and shortcuts with the preview tooling's placeholder ones.

The guard now matches any manifest or apple-touch-icon link regardless of href.
I ran that file's test suite before and after: **41 pass, 6 fail both ways.**
Those 6 failures are pre-existing in your original zip and unrelated — my change
introduced none.

# Verification

- **Import graph: 174 files scanned, 0 broken imports.** Only `h3` is
  undeclared, which is pre-existing and comes in through Nitro.
- **Public assets: 24 paths referenced, 0 missing.**
- **Bracket balance** checked on all 22 files I wrote or edited.

Still not compiled — there's no network here, so `npm install` and `tsc` can't
run. **Run `npm run typecheck` first** and send me anything it reports.

# Worth doing next

1. **Move product images out of Postgres.** Even compressed, storing images as
   base64 text in the database means every cache miss costs a query plus a
   decode. Cloudinary, S3 or Vercel Blob would make this a non-issue.
2. **Wire the public fetches through React Query.** It's already a dependency.
   The footer refetches `/api/categories` on every route change.
3. **Your contact details are still placeholders.** Phone and email say "To be
   published" — the address is real now, those two aren't.

---

# Round 3 — the Vercel deploy

The blank page was a failed build, plus a missing API mount. Both fixed:
`prisma.config.ts` no longer throws without `DATABASE_URL`, and
`server/routes/api/[...].ts` now serves `/api/*` from the Nitro function.
Full explanation and the exact environment variables: **DEPLOY-VERCEL.md**.
