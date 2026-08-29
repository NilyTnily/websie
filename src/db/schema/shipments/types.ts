import type { inquiryShipmentTable } from "./tables";

export type InquiryShipment = typeof inquiryShipmentTable.$inferSelect;
export type NewInquiryShipment = typeof inquiryShipmentTable.$inferInsert;
