import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { DB_DEV_LOGGER } from "~/app";

import * as schema from "./schema";

// Ensure the database URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("🔴 DATABASE_URL environment variable is not set");
}

/**
 * Single postgres client reused across hot module reloads in dev and warm
 * serverless invocations in prod (Vercel). For Neon pooler/pgbouncer we must
 * set `prepare: false` and keep `max` low to avoid connection exhaustion.
 */
type DbConnection = ReturnType<typeof postgres>;
const globalForDb = globalThis as unknown as {
  conn?: DbConnection;
};

// Neon pooler requires `prepare: false`; direct still works with it. Detect
// pooler host and apply serverless-friendly defaults automatically.
const isPooler = process.env.DATABASE_URL?.includes("-pooler");
export const conn: DbConnection =
  globalForDb.conn ??
  postgres(process.env.DATABASE_URL, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: isPooler ? 1 : 10,
    prepare: false,
  });
globalForDb.conn = conn;

// Database connection instance
export const db = drizzle(conn, {
  logger: DB_DEV_LOGGER && process.env.NODE_ENV !== "production",
  schema,
});
