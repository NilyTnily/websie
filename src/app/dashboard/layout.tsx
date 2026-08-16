import { getCurrentUserOrRedirect } from "~/lib/auth";
import { getDeliveredItemsForUser, getInquiriesForUser } from "~/lib/queries/inquiries";

import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUserOrRedirect();
  if (!user) return null;

  const [deliveredItems, orders] = await Promise.all([
    getDeliveredItemsForUser(user.id),
    getInquiriesForUser(user.id),
  ]);
  const insuredValue = deliveredItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const pieceCount = deliveredItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <DashboardShell
          clientSince={user.createdAt}
          insuredValue={insuredValue}
          orderCount={orders.length}
          pieceCount={pieceCount}
        >
          {children}
        </DashboardShell>
      </main>
    </div>
  );
}
