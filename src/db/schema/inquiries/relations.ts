import { relations } from "drizzle-orm";

import { userTable } from "../users/tables";
import { inquiryTable } from "./tables";

export const inquiryRelations = relations(inquiryTable, ({ one }) => ({
  user: one(userTable, {
    fields: [inquiryTable.userId],
    references: [userTable.id],
  }),
}));
