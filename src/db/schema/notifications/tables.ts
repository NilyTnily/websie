import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { userTable } from "../users/tables";

export const notificationTypeEnum = pgEnum("notification_type", [
  "error",
  "info",
  "success",
  "warning",
]);

export const notificationTable = pgTable("notification", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  description: text("description").notNull(),
  id: text("id").primaryKey(),
  link: text("link"),
  read: boolean("read").default(false).notNull(),
  title: text("title").notNull(),
  type: notificationTypeEnum("type").default("info").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});
