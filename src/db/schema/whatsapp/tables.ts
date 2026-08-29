import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { inquiryTable } from "../inquiries/tables";
import { inquiryShipmentTable } from "../shipments/tables";

export const whatsappMessageDirectionEnum = pgEnum(
  "whatsapp_message_direction",
  ["inbound", "outbound"],
);

// How a message got tied to an order: parsed order number in the text,
// sender phone matched against customerContact, an admin manually picked
// it, or it's still sitting unmatched in the inbox.
export const whatsappMatchMethodEnum = pgEnum("whatsapp_match_method", [
  "order_number",
  "phone",
  "manual",
  "unmatched",
]);

export const whatsappMessageStatusEnum = pgEnum("whatsapp_message_status", [
  "received",
  "matched",
  "applied",
  "ignored",
]);

// A log of every inbound (and, later, outbound) WhatsApp Cloud API message,
// carrying the best-effort match/extraction so the admin inbox can offer a
// one-tap "apply as shipment" instead of manual re-typing.
export const whatsappMessageTable = pgTable("whatsapp_message", {
  appliedShipmentId: text("applied_shipment_id").references(
    () => inquiryShipmentTable.id,
    { onDelete: "set null" },
  ),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  direction: whatsappMessageDirectionEnum("direction").notNull(),
  extractedCarrier: text("extracted_carrier"),
  extractedOrderNumber: integer("extracted_order_number"),
  extractedTrackingNumber: text("extracted_tracking_number"),
  fromPhone: text("from_phone").notNull(),
  id: text("id").primaryKey(),
  inquiryId: text("inquiry_id").references(() => inquiryTable.id, {
    onDelete: "set null",
  }),
  matchMethod: whatsappMatchMethodEnum("match_method")
    .default("unmatched")
    .notNull(),
  // Full webhook entry for debugging/replay — Meta's shape, not ours.
  rawPayload: jsonb("raw_payload"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  status: whatsappMessageStatusEnum("status").default("received").notNull(),
  toPhone: text("to_phone").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Meta's own message id — used to dedupe webhook retries.
  waMessageId: text("wa_message_id").notNull().unique(),
});
