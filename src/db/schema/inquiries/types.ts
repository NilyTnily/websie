import type { inquiryTable } from "./tables";

export type Inquiry = typeof inquiryTable.$inferSelect;
export type NewInquiry = typeof inquiryTable.$inferInsert;
