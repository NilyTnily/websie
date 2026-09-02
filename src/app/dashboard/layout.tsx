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

  const userPhone = (user as unknown as { phone?: string | null }).phone;
  const showPhonePrompt = !userPhone;

  return (
    <div className="flex min-h-screen flex-col">
      {showPhonePrompt && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <span className="text-amber-900">
              Add your WhatsApp number to get order updates & New Arrivals — works for Google or email sign-in.
            </span>
            <a
              href="/dashboard/profile"
              className="shrink-0 rounded bg-amber-900 px-3 py-1 text-xs font-medium text-white hover:bg-amber-800"
            >
              Add phone
            </a>
          </div>
        </div>
      )}
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
