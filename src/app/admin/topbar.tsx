"use client";

import {
  ExternalLink,
  FolderTree,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Search,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { signOut } from "~/lib/auth-client";
import { Button } from "~/ui/primitives/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "~/ui/primitives/command";
import { Separator } from "~/ui/primitives/separator";
import { SidebarTrigger } from "~/ui/primitives/sidebar";

const NAV_ITEMS = [
  { href: "/admin/summary", icon: LayoutDashboard, name: "Summary" },
  { href: "/admin/users", icon: Users, name: "Users" },
  { href: "/admin/categories", icon: FolderTree, name: "Categories" },
  { href: "/admin/products", icon: Package, name: "Products" },
  { href: "/admin/inquiries", icon: Inbox, name: "Inquiries" },
  { href: "/admin/reviews", icon: Star, name: "Reviews" },
  { href: "/admin/settings", icon: Settings, name: "Settings" },
];

const CREATE_ACTIONS = [
  {
    href: "/admin/products/new",
    icon: Package,
    name: "New product",
  },
  {
    href: "/admin/categories/new",
    icon: FolderTree,
    name: "New category",
  },
];

export function AdminTopbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    toast.success("Signed out.");
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator className="mr-2 h-4" orientation="vertical" />
        <span className="text-sm font-medium text-muted-foreground">
          Admin Dashboard
        </span>
        <Button
          className={`
            ml-auto h-10 w-10 gap-2 p-0 text-muted-foreground
            sm:h-9 sm:w-64 sm:justify-start sm:px-3
          `}
          onClick={() => setOpen(true)}
          size="sm"
          variant="outline"
        >
          <Search className="size-3.5" />
          <span
            className={`
              hidden
              sm:inline
            `}
          >
            Search…
          </span>
          <kbd
            className={`
              pointer-events-none ml-auto hidden rounded border bg-muted px-1.5
              font-mono text-[10px] font-medium
              sm:inline-block
            `}
          >
            ⌘K
          </kbd>
        </Button>
      </header>

      <CommandDialog onOpenChange={setOpen} open={open} title="Admin search">
        <CommandInput placeholder="Go to a page or run an action…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            {CREATE_ACTIONS.map((action) => (
              <CommandItem
                key={action.href}
                onSelect={() => run(action.href)}
                value={`create ${action.name}`}
              >
                <Plus />
                {action.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Go to">
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => run(item.href)}
                value={item.name}
              >
                <item.icon />
                {item.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Site">
            <CommandItem onSelect={() => run("/")} value="view storefront">
              <ExternalLink />
              View storefront
            </CommandItem>
            <CommandItem onSelect={handleSignOut} value="sign out log out">
              <LogOut />
              Sign out
              <CommandShortcut>⏎</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
