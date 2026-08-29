import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { inquiryTable } from "../inquiries/tables";

// One order can ship in several pieces (multi-item orders, split shipments).
// itemIds narrows a shipment to specific InquiryItem.id values; null/absent
// means it covers the whole order. When an inquiry has zero rows here, the
// UI falls back to the legacy inquiryTable.carrier/.trackingUrl fields.
export const inquiryShipmentTable = pgTable("inquiry_shipment", {
  carrier: text("carrier"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  id: text("id").primaryKey(),
  inquiryId: text("inquiry_id")
    .notNull()
    .references(() => inquiryTable.id, { onDelete: "cascade" }),
  itemIds: jsonb("item_ids").$type<null | string[]>(),
  label: text("label"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
