import { relations } from "drizzle-orm";

import { inquiryTable } from "../inquiries/tables";
import { inquiryShipmentTable } from "./tables";

export const inquiryShipmentRelations = relations(
  inquiryShipmentTable,
  ({ one }) => ({
    inquiry: one(inquiryTable, {
      fields: [inquiryShipmentTable.inquiryId],
      references: [inquiryTable.id],
    }),
  }),
);
