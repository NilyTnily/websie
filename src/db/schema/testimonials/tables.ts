import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const testimonialTable = pgTable("testimonial", {
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  customerHandle: text("customer_handle").notNull(),
  customerName: text("customer_name").notNull(),
  id: text("id").primaryKey(),
  quote: text("quote").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});
