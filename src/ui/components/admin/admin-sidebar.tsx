"use client";

import {
  BellRing,
  ExternalLink,
  FolderTree,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Quote,
  Settings,
  Star,
  Users,
  Watch,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { signOut } from "~/lib/auth-client";
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
  { href: "/admin/users", icon: Users, name: "Users" },
  { href: "/admin/categories", icon: FolderTree, name: "Categories" },
  { href: "/admin/products", icon: Package, name: "Products" },
  { href: "/admin/inquiries", icon: Inbox, name: "Inquiries" },
  { href: "/admin/whatsapp", icon: MessageCircle, name: "WhatsApp" },
  { href: "/admin/reviews", icon: Star, name: "Reviews" },
  { href: "/admin/stock-notifications", icon: BellRing, name: "Stock Alerts" },
  { href: "/admin/testimonials", icon: Quote, name: "Testimonials" },
  { href: "/admin/settings", icon: Settings, name: "Settings" },
];

interface AdminSidebarProps {
  /** Pending-work counts keyed by nav href — rendered as a badge when > 0. */
  badges?: Partial<Record<string, number>>;
  userEmail: string;
  userImage?: null | string;
  userName: string;
}

const NO_BADGES: NonNullable<AdminSidebarProps["badges"]> = {};

export function AdminSidebar({
  badges = NO_BADGES,
  userEmail,
  userImage,
  userName,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out.");
    router.push("/");
    router.refresh();
  };

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
                const count = badges[item.href];
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={
                        count && count > 0
                          ? `${item.name} (${count})`
                          : item.name
                      }
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                        {count && count > 0 ? (
                          <span
                            className={`
                              ml-auto rounded-full bg-primary px-2 py-0.5
                              text-[11px] leading-none font-semibold
                              text-primary-foreground
                              group-data-[collapsible=icon]:hidden
                            `}
                          >
                            {count > 99 ? "99+" : count}
                          </span>
                        ) : null}
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
                  <AvatarFallback
                    className={`rounded-md bg-primary/10 text-primary`}
                  >
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
            <SidebarMenuButton asChild tooltip="View site">
              <Link href="/">
                <ExternalLink />
                <span>View site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign out">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
