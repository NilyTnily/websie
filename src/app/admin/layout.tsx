import type React from "react";

import { redirect } from "next/navigation";

import { isAdminEmail } from "~/lib/admin";
import { getCurrentUserOrRedirect } from "~/lib/auth";
import { AdminSidebar } from "~/ui/components/admin/admin-sidebar";
import { Separator } from "~/ui/primitives/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/ui/primitives/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserOrRedirect();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AdminSidebar
        userEmail={user.email}
        userImage={user.image}
        userName={user.name}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator className="mr-2 h-4" orientation="vertical" />
          <span className="text-sm font-medium text-muted-foreground">
            Admin Dashboard
          </span>
        </header>
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
