import type { productReviewTable } from "./tables";

export type NewProductReview = typeof productReviewTable.$inferInsert;
export type ProductReview = typeof productReviewTable.$inferSelect;
