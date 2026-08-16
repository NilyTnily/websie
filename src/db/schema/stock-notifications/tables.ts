import { boolean, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { productTable } from "../catalog/tables";

// One row per (product, email) signup — the unique index is the dedupe
// mechanism, so createStockNotification can insert-or-ignore instead of
// needing a pre-check. notified flips to true once the restock email goes
// out (see notifyPendingSubscribers), so a product going out of stock and
// back in again doesn't re-email someone who already got their alert.
export const stockNotificationTable = pgTable(
  "stock_notification",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    email: text("email").notNull(),
    id: text("id").primaryKey(),
    notified: boolean("notified").default(false).notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("stock_notification_product_email_idx").on(
      table.productId,
      table.email,
    ),
  ],
);
