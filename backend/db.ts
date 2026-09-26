import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * A missing DATABASE_URL used to surface as a `pg` error about connecting to
 * "localhost:5432" from inside a Vercel function -- which reads like a database
 * outage rather than an unset variable. Name it once, here.
 */
const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error(
    "[db] DATABASE_URL is not set. Every /api route that touches the database will fail. " +
      "Set DATABASE_URL (pooled) and DIRECT_URL (unpooled) in your environment -- see .env.example.",
  );
}

/**
 * Pool sizing matters on Vercel. Each concurrent invocation gets its own module
 * instance and therefore its own pool, so the default `max` (10) multiplies by
 * the number of warm functions and exhausts Postgres' connection limit under
 * even light traffic. A serverless function handles one request at a time, so a
 * small pool with a short idle timeout is both sufficient and safe.
 *
 * Use the POOLED connection string for DATABASE_URL (Neon's `-pooler` host,
 * Supabase's port 6543, or PgBouncer) and keep DIRECT_URL for migrations.
 */
function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

// Cache on globalThis in EVERY environment, not just development. In dev this
// stops HMR from leaking a pool per reload; on a serverless host it keeps a
// warm container reusing one client if this module is ever evaluated twice
// (two entry chunks importing it, for instance) instead of opening a second pool.
globalThis.prisma = prisma;
