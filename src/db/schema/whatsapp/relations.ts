import { relations } from "drizzle-orm";

import { inquiryTable } from "../inquiries/tables";
import { inquiryShipmentTable } from "../shipments/tables";
import { whatsappMessageTable } from "./tables";

export const whatsappMessageRelations = relations(
  whatsappMessageTable,
  ({ one }) => ({
    appliedShipment: one(inquiryShipmentTable, {
      fields: [whatsappMessageTable.appliedShipmentId],
      references: [inquiryShipmentTable.id],
    }),
    inquiry: one(inquiryTable, {
      fields: [whatsappMessageTable.inquiryId],
      references: [inquiryTable.id],
    }),
  }),
);
