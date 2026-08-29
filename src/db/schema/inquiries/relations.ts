import { relations } from "drizzle-orm";

import { inquiryShipmentTable } from "../shipments/tables";
import { userTable } from "../users/tables";
import { whatsappMessageTable } from "../whatsapp/tables";
import { inquiryTable } from "./tables";

export const inquiryRelations = relations(inquiryTable, ({ many, one }) => ({
  shipments: many(inquiryShipmentTable),
  user: one(userTable, {
    fields: [inquiryTable.userId],
    references: [userTable.id],
  }),
  whatsappMessages: many(whatsappMessageTable),
}));
