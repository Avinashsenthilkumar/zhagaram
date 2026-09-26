#!/usr/bin/env node
/**
 * `prisma migrate deploy`, wrapped so it is safe to put in a deploy pipeline.
 *
 * - No database configured (local build, a preview with no env) -> skip, exit 0.
 * - `SKIP_DB_MIGRATE=1` -> skip. The escape hatch: set it as an environment
 *   variable in the Vercel project if you would rather run migrations by hand
 *   and not have a migration problem fail the build.
 * - Otherwise run the migrations and propagate a real failure, because shipping
 *   a build against a schema that did not apply is how you get a site that
 *   answers 500 on every data route.
 *
 * DIRECT_URL is preferred: DDL through a transaction-mode pooler (PgBouncer,
 * Supabase :6543, Neon's `-pooler` host) is unreliable, and `prisma.config.ts`
 * resolves the datasource in this same order.
 */
import "dotenv/config";
import { spawn } from "node:child_process";
import { constants as osConstants } from "node:os";

if (process.env.SKIP_DB_MIGRATE === "1") {
  console.log("[prisma] SKIP_DB_MIGRATE=1 - skipping Prisma migrations.");
  process.exit(0);
}

const connectionString = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.log("[prisma] no DATABASE_URL / DIRECT_URL - skipping Prisma migrations.");
  process.exit(0);
}

if (!process.env.DIRECT_URL?.trim()) {
  console.warn(
    "[prisma] DIRECT_URL is not set, falling back to DATABASE_URL. " +
      "If DATABASE_URL points at a connection pooler, migrations may fail - set DIRECT_URL to the unpooled string.",
  );
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("error", (error) => {
  console.error("[prisma] could not start `prisma migrate deploy`:", error?.message || error);
  process.exit(127);
});

child.on("exit", (code, signal) => {
  // Do NOT re-raise the signal at this process: a self-directed signal is
  // delivered unreliably under emulation, and `128 + signo` is what a shell
  // reports for a signal-killed command anyway.
  if (signal) {
    const signo = osConstants.signals[signal];
    process.exit(128 + (typeof signo === "number" ? signo : 1));
  }
  process.exit(code ?? 1);
});
