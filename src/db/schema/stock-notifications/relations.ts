import { relations } from "drizzle-orm";

import { productTable } from "../catalog/tables";
import { stockNotificationTable } from "./tables";

export const stockNotificationRelations = relations(
  stockNotificationTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [stockNotificationTable.productId],
      references: [productTable.id],
    }),
  }),
);
