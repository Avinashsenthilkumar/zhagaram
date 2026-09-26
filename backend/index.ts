/**
 * Express wrapper around the API in ./api-core.
 *
 * WHY THIS FILE IS NOT IN server/
 * -------------------------------
 * vite.config.ts sets `nitro({ serverDir: "./server" })`, so Nitro scans that
 * directory when it builds the deployed function. With an Express app sitting
 * in there, the deployed site served EXPRESS at "/" instead of the React app:
 *
 *   $ curl -i https://zhagaram-new.vercel.app/
 *   HTTP/2 200
 *   x-powered-by: Express                <- not TanStack Start
 *   access-control-allow-credentials: true
 *   (empty body)
 *
 * Express has no route for "/", so it answered 200 with nothing, and the
 * browser rendered a blank page. Meanwhile /api/health worked, because Express
 * really does have that route -- which is what made the failure so confusing.
 *
 * The frontend-only repo this project was merged from had exactly one thing in
 * server/: middleware/grok-pwa.ts. Keeping server/ to Nitro-owned files only
 * restores that arrangement.
 *
 * Run it with: npm run dev:api   (tsx backend/index.ts)
 */
import "dotenv/config";

import compression from "compression";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import { prisma } from "./db";
import { handleApiRequest, handleEnquiryRequest } from "./api-core";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://zhagaram-frontend-lac.vercel.app",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      console.error("CORS blocked origin:", origin);
      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  }),
);

// PERF: gzip/deflate every JSON + image response above 1 KB. Product and
// category payloads carry long description text, so this typically cuts the
// bytes on the wire by 70-85%. Purely transport-level -- no route, no payload
// and no status code changes.
app.use(compression({ threshold: 1024 }));

app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is running",
  });
});

const transientDbErrorCodes = new Set(["P1001", "P1002", "P1017"]);
function isTransientDbError(error: unknown) {
  if (!error) return false;
  if (typeof error === "object" && "code" in error && typeof (error as any).code === "string" && transientDbErrorCodes.has((error as any).code)) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /connection terminated/i.test(message) || /connection.*timed out/i.test(message) || /connection lost/i.test(message);
}

app.use("/api", async (req, res, next) => {
  const run = async () => {
    const handled = await handleApiRequest(req, res);
    if (handled === null && !res.headersSent) next();
  };
  try {
    await run();
  } catch (error) {
    if (isTransientDbError(error) && !res.headersSent) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        await prisma.$connect();
        await run();
        return;
      } catch (retryError) {
        return next(retryError);
      }
    }
    next(error);
  }
});

app.post("/api/enquiry", handleEnquiryRequest);

app.use((error: any, _req: any, res: any, next: any) => {
  if (error?.type === "entity.too.large" || error?.status === 413) {
    return res.status(413).json({ success: false, message: "Image payload is too large. Please use an image smaller than 3 MB." });
  }
  return next(error);
});

app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API error:", error);

  if (res.headersSent) return;

  const statusCode =
    typeof error?.statusCode === "number"
      ? error.statusCode
      : 500;

  res.status(statusCode).json({
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "Something went wrong.",
  });
});


/**
 * Start the HTTP listener.
 *
 * Nothing in the Nitro build imports this file any more -- the Vercel function
 * imports ./api-core directly -- so the simple guard is enough again: listen
 * everywhere except on Vercel, where there is no port to bind.
 */
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 4000);

  app.listen(port, "0.0.0.0", () => {
    console.log(`ZHAGARAM API listening on http://0.0.0.0:${port}`);
  });
}

export default app;
