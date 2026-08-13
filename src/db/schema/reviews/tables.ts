import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { productTable } from "../catalog/tables";
import { userTable } from "../users/tables";

// Not moderated by default (approved: false) — a review only shows on the
// product page once an admin approves it, same review-queue pattern as
// inquiries. Submission is gated to signed-in users who actually have an
// inquiry containing this product (see reviews query layer), so there's no
// separate anti-spam system to build.
export const productReviewTable = pgTable("product_review", {
  approved: boolean("approved").default(false).notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  customerName: text("customer_name").notNull(),
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});
