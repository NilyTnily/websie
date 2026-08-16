import type { stockNotificationTable } from "./tables";

export type NewStockNotification = typeof stockNotificationTable.$inferInsert;
export type StockNotification = typeof stockNotificationTable.$inferSelect;
