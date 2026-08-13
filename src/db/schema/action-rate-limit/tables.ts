import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Rate limiting for Server Actions — separate from better-auth's own
// "rate_limit" table since Server Actions aren't HTTP routes better-auth
// can intercept. DB-backed for the same reason as the auth one: holds up
// under multiple server instances, unlike an in-memory counter.
export const actionRateLimitTable = pgTable("action_rate_limit", {
  count: integer("count").notNull(),
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  windowStart: timestamp("window_start").notNull(),
});
