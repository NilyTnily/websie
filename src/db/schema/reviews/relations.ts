import { relations } from "drizzle-orm";

import { productTable } from "../catalog/tables";
import { userTable } from "../users/tables";
import { productReviewTable } from "./tables";

export const productReviewRelations = relations(
  productReviewTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productReviewTable.productId],
      references: [productTable.id],
    }),
    user: one(userTable, {
      fields: [productReviewTable.userId],
      references: [userTable.id],
    }),
  }),
);
