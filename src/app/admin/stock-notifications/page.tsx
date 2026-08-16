import { getAllStockNotificationsForAdmin } from "~/lib/queries/stock-notifications";

import { StockNotificationsPageClient } from "./page.client";

export default async function AdminStockNotificationsPage() {
  const notifications = await getAllStockNotificationsForAdmin();

  return <StockNotificationsPageClient notifications={notifications} />;
}
