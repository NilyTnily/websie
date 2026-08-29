import type React from "react";

import { redirect } from "next/navigation";

import { isAdminEmail } from "~/lib/admin";
import { getCurrentUserOrRedirect } from "~/lib/auth";
import { getInquiryStats } from "~/lib/queries/inquiries";
import { getReviewStats } from "~/lib/queries/reviews";
import { AdminSidebar } from "~/ui/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider } from "~/ui/primitives/sidebar";

import { AdminTopbar } from "./topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserOrRedirect();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/");
  }

  // Pending-work counts for sidebar badges. Failures fall back to zero so a
  // stats query error can never take down the whole admin shell.
  const [inquiryStats, reviewStats] = await Promise.all([
    getInquiryStats().catch(() => null),
    getReviewStats().catch(() => null),
  ]);

  return (
    <SidebarProvider>
      <AdminSidebar
        badges={{
          "/admin/inquiries": inquiryStats?.pending ?? 0,
          "/admin/reviews": reviewStats?.pending ?? 0,
        }}
        userEmail={user.email}
        userImage={user.image}
        userName={user.name}
      />
      <SidebarInset>
        <AdminTopbar />
        <div
          className={`
            flex-1 space-y-6 p-4
            md:p-6
          `}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
