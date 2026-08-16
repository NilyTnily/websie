import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// One row per signup. Email is unique so a repeat signup is a silent
// insert-or-ignore rather than an error, matching the stock-notification
// dedupe pattern.
export const newsletterSignupTable = pgTable("newsletter_signup", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  email: text("email").notNull().unique(),
  id: text("id").primaryKey(),
});
