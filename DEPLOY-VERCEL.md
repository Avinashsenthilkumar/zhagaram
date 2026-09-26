# Deploying to Vercel — one project, site + API together

This replaces the old two-deployment setup (frontend on Vercel, API on Render).
Everything now ships from this one repo as one Vercel project.

---

## The blank page — the actual cause

Measured with PowerShell against the live site (my own fetch tooling could not
decode Vercel's compressed HTML, which sent me down a wrong path first):

```
STATUS: 200
BYTES : 0
X-Powered-By: Express
Access-Control-Allow-Credentials: true
Transfer-Encoding: chunked
```

**Express was serving `/`, not the React app.** Express has no route for `/`,
so it answered `200` with an empty body, and the browser rendered nothing.

Why Express was in the request path: `vite.config.ts` sets
`nitro({ serverDir: "./server" })`, and the merge had put the entire Express
API into that same `server/` directory — including `server/server.node.ts`,
whose only content was `import app from "./index"; export default app;`. Nitro
picked the Express app up as the server handler for the deployed function.

The frontend-only repo this project was merged from had exactly **one** file in
`server/`: `middleware/grok-pwa.ts`. That is why it deployed fine and the merged
project did not.

This also explains the symptoms that kept contradicting each other:

| Symptom | Reason |
| --- | --- |
| `/api/health` returned JSON | Express really has `app.get("/api/health")` |
| `/api/products` returned 500 | Express's `/api` router, hitting an unconfigured database |
| `?install=1` returned HTML | Nitro middleware runs first and answers directly |
| `robots.txt` worked | static CDN file, never reaches the function |
| `/` was blank | Express had no route for it |

### The fix

The Express app moved out of Nitro's scanned directory entirely:

```
backend/api-core.ts   the API with no web framework (both handlers live here)
backend/index.ts      Express wrapper -- npm run dev:api, or any Node host
backend/auth.ts       moved from server/
backend/db.ts         moved from server/
backend/mailer.ts     moved from server/

server/middleware/grok-pwa.ts     Nitro-owned
server/routes/api/[...].ts        Nitro-owned, imports backend/api-core
server/routes/api/health.get.ts   Nitro-owned
```

`server/server.node.ts` was deleted — nothing imported it, and it was the file
handing Nitro an Express app.

No route logic changed. `handleApiRequest` and `handleEnquiryRequest` are the
same functions, now imported by both hosts instead of living beside the Express
app. `npm run dev:api` behaves exactly as before.

### A correction

An earlier version of this document blamed the streaming `<head>` injector in
`server/middleware/grok-pwa.ts`. That was wrong. The evidence for it — injected
HTML unreadable, direct HTML readable — was a compression artifact of the
tooling used to test, not corruption. The injector removal is kept because it
did perform `readFileSync` on paths that do not exist inside a serverless
function, but it was not the blank page.

## Earlier diagnosis (superseded)

## The blank page — found and fixed

Measured against your live deployment at `zhagaram-new.vercel.app`:

| Request | How it is served | Result |
| --- | --- | --- |
| `/robots.txt` | static CDN file | correct |
| `/sitemap.xml` | static CDN file | correct |
| `/api/health` | Nitro function | `{"success":true,...}` |
| `/?install=1&platform=ios` | HTML returned **directly** | correct |
| `/` | HTML through the **stream injector** | corrupt |
| `/about` | HTML through the **stream injector** | corrupt |

Same function, same content type, same compression. The only difference was
`server/middleware/grok-pwa.ts`, which piped every HTML document through a
TransformStream to inject platform PWA/OG `<head>` tags. That transform
corrupted the response body, and a corrupt HTML document renders as a blank
page. It also called `readFileSync`/`existsSync` on `src/lib/og/site.json` and
`public/og.*` at request time — paths that do not exist inside a serverless
function, as that file's own comment already warned.

The middleware now passes documents through untouched. Nothing is lost: the app
ships its own, better PWA identity in `public/manifest.webmanifest`,
`public/icons/*` and the head tags in `src/routes/__root.tsx`.

One tripwire test in `scripts/grok-pwa-plugin.test.mjs` asserted that the
injector wiring was still present, so it was updated to assert the replacement
instead. The suite is back to its original 41 pass / 6 fail — those 6 failures
are pre-existing in the code you sent me and unrelated.

## `/api/products` returns 500 — set the database variables

`/api/health` works, so the function is running. `/api/products` returns 500,
which is Prisma failing to reach the database. Set `DATABASE_URL` and
`DIRECT_URL` in Vercel, then run the migrations from your machine against that
same database (Vercel will not run them for you):

```bash
npm run db:migrate:deploy
npm run db:seed
```

Until that is done the catalogue falls back to the static sample products and
admin login cannot work.

## Why the last build failed

```
> postinstall
> prisma generate
Failed to load config file "/vercel/path0" as a TypeScript/JavaScript module.
Error: PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL.
npm error command sh -c prisma generate
Error: Command "npm install" exited with 1
```

`prisma.config.ts` read the database URL with prisma/config's `env()` helper,
which **throws** when the variable is missing. `prisma generate` runs from
`postinstall`, so `npm install` itself died and no deployment was ever
produced. The blank page you saw was Vercel having nothing to serve.

`prisma generate` only reads `prisma/schema.prisma` — it never connects to a
database — so needing a live `DATABASE_URL` to generate a client was wrong.
It now reads `process.env` directly with a placeholder fallback. Commands that
genuinely need a database (`migrate deploy`, `db seed`) still fail loudly, but
with a message about the connection instead of about loading a config file.

## The second problem: /api/* was a 404 in production

Nitro only scans `server/routes`, `server/middleware`, `server/api` and
`server/plugins`. `server/index.ts` — the whole Express API — was never part of
the Vercel build. So in production every one of these returned 404:

```
/api/products   /api/categories   /api/testimonials
/api/auth/*     /api/admin/*      /api/enquiry
```

No products, no categories, no testimonials, and no admin login.

`server/routes/api/[...].ts` now serves them from the Nitro function. It does
not reimplement anything: `handleApiRequest` and `handleEnquiryRequest` were
already framework-agnostic, so it builds a request/response pair from the h3
event and hands them the same objects Express did. One set of route logic,
two hosts — `npm run dev:api` still runs the Express server locally.

---

## Settings

**Framework Preset:** Other (or leave whatever it detected — the build writes
`.vercel/output`, which Vercel uses ahead of any framework preset).

**Build Command:** leave blank so it uses `package.json`. Vercel prefers the
`vercel-build` script when one exists, and this project now has one:

```
vercel-build = node scripts/prisma-migrate-deploy.mjs && npm run build
```

So a deploy applies pending Prisma migrations and then builds — you no longer
have to remember to migrate by hand, which is what left the last deployment
answering 500 on `/api/products`. The migration step **skips itself** when no
database URL is configured, and you can turn it off entirely by setting
`SKIP_DB_MIGRATE=1` in the project's environment variables. Seeding stays
manual, because it writes the admin account.

**Install Command:** leave blank (`npm install`).

**Output Directory:** leave blank.

**Node version:** 22.x. `package.json` now declares
`"engines": { "node": ">=22.12.0" }`, because Vite 8 will not run on Node 18.

## Environment variables

Set these in **Settings → Environment Variables**, for Production *and*
Preview. The two marked **build-time** must exist before the build runs.

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled Postgres connection string |
| `DIRECT_URL` | yes | Direct (unpooled) connection string — used for migrations |
| `JWT_SECRET` | yes | Long random string. Admin login is broken without it |
| `ADMIN_EMAIL` | for seeding | Admin account address |
| `ADMIN_PASSWORD` | for seeding | Admin password, 8+ characters |
| `ADMIN_NAME` | optional | Defaults to "Administrator" |
| `VITE_API_URL` | **build-time** | **Leave EMPTY.** See below |
| `VITE_AUTH_ENABLED` | **build-time** | `true` |
| `APP_URL` | **yes — see below** | Your deployed URL, e.g. `https://zhagaram-new.vercel.app` |
| `PUBLIC_SITE_URL` | yes | Same as `APP_URL` |
| `FRONTEND_URL` | optional | Leave empty — one origin means no CORS |
| `RESEND_API_KEY` | for emails | Only the enquiry form needs it |
| `MAIL_FROM` | for emails | Verified sender address |
| `MAIL_TO` | for emails | Where enquiries are delivered |

### `APP_URL` is what makes server-rendered product pages show real data

The product list and each product page load the catalogue in a route `loader`,
and a loader runs **on the server** for the first request. Node's `fetch` rejects
a relative URL, so `fetch("/api/products")` threw there — and because
`src/lib/catalog-api.ts` catches everything and returns the static sample
catalogue, it looked like it worked. The deployed site rendered the six
placeholder products from `src/data/products.ts` on every cold load no matter
what was in the database, and any product that existed **only** in the database
404'd until the browser took over.

`apiUrl()` now builds an absolute URL when it runs on the server, choosing in
this order:

1. `APP_URL` / `PUBLIC_SITE_URL`
2. `VERCEL_PROJECT_PRODUCTION_URL` (set automatically by Vercel)
3. `VERCEL_URL` (this deployment — returns 401 on a preview with Deployment
   Protection on, which is why it is last)
4. `http://127.0.0.1:$PORT` for local `npm run dev:api`

Set `APP_URL` and you never depend on the fallbacks. Browser requests and every
image `src` stay relative, so nothing is pinned to one hostname.

### `VITE_API_URL` must be empty

This is the one that will bite you. It is baked in at build time.

- **Empty** → the site calls `/api/products` on its own origin. One DNS lookup,
  one TLS handshake, no CORS preflight. This is the point of merging.
- **Set to the old Render URL** → the site calls that host instead. If it is
  asleep or gone, products and categories silently fall back to the static
  sample data and the admin login fails — which looks exactly like "the API is
  broken".

If it is set from the old split setup, **delete it**, then redeploy. Changing it
requires a rebuild; a redeploy from cache will not pick it up.

## Database setup, once

**Migrations now run themselves on every deploy** (the `vercel-build` script
above), so the only step left is seeding. From your machine, with the production
connection string in `.env`:

```bash
npm run db:seed
```

`db:seed` creates the catalogue rows and the admin user from `ADMIN_EMAIL` /
`ADMIN_PASSWORD`. It reads `DIRECT_URL` first and falls back to `DATABASE_URL`.

To apply migrations by hand instead — set `SKIP_DB_MIGRATE=1` on Vercel and run:

```bash
npm run db:migrate:deploy
```

**`DIRECT_URL` genuinely matters here.** DDL through a transaction-mode pooler
(Supabase's port 6543, PgBouncer, Neon's `-pooler` host) fails or hangs, so
`DATABASE_URL` should be the pooled string for the app and `DIRECT_URL` the
unpooled one for migrations. The migration wrapper warns when `DIRECT_URL` is
missing rather than failing silently.

## After deploying, check in this order

1. `https://<your-app>.vercel.app/api/health` → `{"success":true,...}`
   Fails here and the Nitro function is not running — read the build log.
2. `https://<your-app>.vercel.app/api/products` → a JSON array.
   A 500 here means `DATABASE_URL` is wrong or migrations have not run.
3. The home page → categories and products appear.
4. `/login` → sign in → `/admin` loads.
5. `/contact` → the map renders.

## If the page is still blank

1. **Open the browser console.** A blank page always leaves an error there, and
   it will name the cause in one line.
2. **Clear the service worker.** Add `?sw=off` to any URL:
   `https://<your-app>.vercel.app/?sw=off`. That unregisters the worker and
   empties its caches. A worker holding a broken deploy is the usual reason a
   site stays blank *after* the fix is live — especially on a phone.
3. **Check the Vercel build log actually says "Build Completed".** A failed
   build leaves the previous deployment (or nothing) in place.
4. **Check the function log** under Deployments → your deploy → Functions, for
   runtime errors from `/api/*`.

---

## Known trade-off

`server/routes/api/[...].ts` imports `server/index.ts`, which creates the
Express app at module scope. Express therefore gets bundled into the Nitro
function even though this path never calls it — a couple of hundred KB of
function size, no runtime cost. It is deliberate: the alternative was splitting
a 780-line file and risking a behaviour change in every route. `app.listen()` is
guarded so importing it never binds a port.
