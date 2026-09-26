> **SUPERSEDED.** This guide describes the old two-deployment setup (Vite
> frontend on Vercel, Express API on Render). The projects are now merged and
> deploy as a single Vercel project — see **DEPLOY-VERCEL.md**. Kept for
> reference on the separate-hosts arrangement.

# ZHAGARAM EXIM — Demo Deployment Guide

## 1. Deploy backend first

Create a separate Vercel project from `zhagaram-backend`.

Set these environment variables in the backend Vercel project:

- `DATABASE_URL` — production PostgreSQL connection string
- `DIRECT_URL` — direct PostgreSQL connection string used by Prisma migrations
- `JWT_SECRET` — long random secret
- `FRONTEND_URL` — exact frontend URL, e.g. `https://zhagaram-nine.vercel.app`
- `APP_URL` — exact frontend URL
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `MAIL_FROM`
- `MAIL_TO`

Build command: `npm run build`

After deployment, verify:

`https://<backend-domain>/api/health`

Expected:

```json
{"success":true,"message":"API is running"}
```

## 2. Deploy frontend second

Create a separate Vercel project from `zhagaram-frontend`.

Set:

- `VITE_API_URL` = the backend origin, e.g. `https://zhagaram-backend.vercel.app`

Build command: `npm run build`

Do not add database, Prisma, JWT, or SMTP secrets to the frontend project.

## 3. Demo smoke test

1. Open frontend home page.
2. Open `/products` and confirm database products/categories load.
3. Open a product detail page and confirm its database image loads.
4. Submit the Get a Quote/enquiry form.
5. Open `/login` and sign in with the configured admin account.
6. Open `/admin` and verify dashboard, categories, products, and reviews.
7. Verify the backend `/api/health` separately.

The frontend no longer uses an Express/Nitro server entry. The frontend is handled by TanStack Start/Nitro, while all `/api/*` requests go to the separate Express backend.
