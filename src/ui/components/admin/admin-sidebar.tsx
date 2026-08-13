"use client";

import {
  FolderTree,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Quote,
  Settings,
  Star,
  Watch,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "~/ui/primitives/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/ui/primitives/sidebar";

const ADMIN_NAV = [
  { href: "/admin/summary", icon: LayoutDashboard, name: "Summary" },
  { href: "/admin/categories", icon: FolderTree, name: "Categories" },
  { href: "/admin/products", icon: Package, name: "Products" },
  { href: "/admin/inquiries", icon: Inbox, name: "Inquiries" },
  { href: "/admin/reviews", icon: Star, name: "Reviews" },
  { href: "/admin/testimonials", icon: Quote, name: "Testimonials" },
  { href: "/admin/settings", icon: Settings, name: "Settings" },
];

interface AdminSidebarProps {
  userEmail: string;
  userImage?: null | string;
  userName: string;
}

export function AdminSidebar({
  userEmail,
  userImage,
  userName,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/admin/summary">
                <div
                  className={`
                    flex aspect-square size-8 items-center justify-center
                    rounded-md bg-primary text-primary-foreground
                  `}
                >
                  <Watch className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">KRS Admin</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Dashboard
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_NAV.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <div>
                <Avatar className="h-8 w-8 rounded-md">
                  <AvatarImage
                    alt={userName || "Admin"}
                    src={userImage || undefined}
                  />
                  <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                    {(userName || "A").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {userName || "Admin"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to site">
              <Link href="/">
                <LogOut />
                <span>Back to site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
