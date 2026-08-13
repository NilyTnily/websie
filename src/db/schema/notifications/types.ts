import type { notificationTable } from "./tables";

export type NewNotification = typeof notificationTable.$inferInsert;
export type NotificationRow = typeof notificationTable.$inferSelect;
