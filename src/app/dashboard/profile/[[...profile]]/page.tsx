import { getCurrentUser } from "~/lib/auth";
import { getInquiriesForUser } from "~/lib/queries/inquiries";

import { ProfilePageClient } from "./page.client";

const RECENT_ORDERS_LIMIT = 3;

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const orders = user ? await getInquiriesForUser(user.id) : [];

  return (
    <ProfilePageClient
      orderCount={orders.length}
      recentOrders={orders.slice(0, RECENT_ORDERS_LIMIT)}
    />
  );
}
