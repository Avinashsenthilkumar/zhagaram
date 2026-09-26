# ZHAGARAM EXIM Frontend

TanStack Start + React frontend for ZHAGARAM EXIM LLP. The API/database/email backend is deployed separately.

## Local development

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_URL` to the backend origin, normally `http://localhost:4000`.
3. Run `npm install`.
4. Run `npm run dev`.

## Vercel

Set `VITE_API_URL` to the deployed backend origin, for example `https://zhagaram-backend.vercel.app`. Do not put database credentials or SMTP secrets in this frontend project.
