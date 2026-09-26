import "dotenv/config";

import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * `prisma generate` only reads the schema -- it never opens a connection.
 * The previous version used prisma/config's `env("DATABASE_URL")` helper,
 * which THROWS when the variable is unset, so `prisma generate` (and with it
 * `npm install`, via postinstall) died on any machine without a database
 * configured. That is exactly what broke the Vercel build:
 *
 *   PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL
 *   npm error command sh -c prisma generate
 *
 * Reading process.env directly with a placeholder fallback keeps `generate`
 * working everywhere. The commands that genuinely need a database
 * (`migrate deploy`, `db seed`) still fail loudly, but with a message about
 * the connection rather than about loading this config file.
 */
const placeholder = "postgresql://user:password@localhost:5432/placeholder";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || placeholder,
  },
  migrations: {
    path: path.join("migrations", "prisma"),
    seed: "tsx prisma/seed.ts",
  },
});
