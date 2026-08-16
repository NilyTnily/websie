import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { userTable } from "../users/tables";

export interface InquiryDeliveryAddress {
  city: string;
  name: string;
  postcode: string;
  street: string;
}

export interface InquiryItem {
  id: string;
  image: string;
  name: string;
  price: number;
  quantity: number;
}

export const deliveryMethodEnum = pgEnum("delivery_method", [
  "courier",
  "hand_delivery",
  "collect",
]);

export const presentationOptionEnum = pgEnum("presentation_option", [
  "house_case",
  "gift",
  "engraving",
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "pending",
  "approved",
  "rejected",
]);

// Mirrors how a made-to-order/authenticated piece actually moves: sits with
// the house for review, then — once staff act on it — confirmed, prepared
// in the workshop, handed to a courier, then out for delivery. Ordered so
// the progress tracker can find "how far along" a status is just from its
// position in this list. New inquiries start at "pending_review" and only
// reach "placed" after an admin has actually looked at them.
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending_review",
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
]);

// A cart handed off as a purchase request (via WhatsApp or another channel)
// rather than a paid order — this shop takes inquiries, not card payments.
export const inquiryTable = pgTable("inquiry", {
  carrier: text("carrier"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  customerContact: text("customer_contact").notNull(),
  customerName: text("customer_name").notNull(),
  // Checkout-only fields — null on lightweight drawer inquiries, populated
  // when the full /checkout flow is used.
  deliveryAddress: jsonb("delivery_address").$type<InquiryDeliveryAddress>(),
  deliveryCost: integer("delivery_cost"),
  deliveryMethod: deliveryMethodEnum("delivery_method"),
  deliveryStatus: deliveryStatusEnum("delivery_status")
    .default("pending_review")
    .notNull(),
  engravingText: text("engraving_text"),
  id: text("id").primaryKey(),
  items: jsonb("items").$type<InquiryItem[]>().notNull(),
  note: text("note"),
  // Human-facing reference (formatted as KRS-000123) — a real Postgres
  // identity column, so it's guaranteed unique and sequential without any
  // application-level counter logic to get wrong.
  orderNumber: integer("order_number").notNull().generatedAlwaysAsIdentity(),
  presentationCost: integer("presentation_cost"),
  presentationOption: presentationOptionEnum("presentation_option"),
  status: inquiryStatusEnum("status").default("pending").notNull(),
  subtotal: integer("subtotal").notNull(),
  trackingUrl: text("tracking_url"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Nullable: guests can still submit an inquiry without an account. Only
  // signed-in submissions show up under "My Orders".
  userId: text("user_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
});
