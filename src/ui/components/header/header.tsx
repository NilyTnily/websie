"use client";

import { Menu, Search, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { useCurrentUser } from "~/lib/auth-client";
import { cn } from "~/lib/cn";
import { useSiteSettings } from "~/lib/hooks/use-site-settings";
import { Cart } from "~/ui/components/cart";
import { Button } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";

import { NotificationsWidget } from "../notifications/notifications-widget";
import { HeaderUserDropdown } from "./header-user";

interface HeaderProps {
  children?: React.ReactNode;
  showAuth?: boolean;
}

export function Header(props: HeaderProps) {
  return (
    <Suspense fallback={null}>
      <HeaderContent {...props} />
    </Suspense>
  );
}

const CATALOG_PATHS = ["/products", "/watches", "/jewelry"];

function HeaderContent({ showAuth = true }: HeaderProps) {
  const pathname = usePathname();
  const { isPending, user } = useCurrentUser();
  const settings = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Exposes the header's real, current height as a CSS variable so sections
  // like the hero can size themselves against "the rest of the viewport"
  // instead of guessing a fixed pixel offset — stays correct automatically
  // if the header ever grows (e.g. the mobile menu opening) or shrinks.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const setHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${header.offsetHeight}px`,
      );
    };

    setHeaderHeight();
    const observer = new ResizeObserver(setHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const mainNavigation = [
    { href: "/", name: "Home" },
    { href: "/products", name: "Catalog" },
    { href: "/about", name: "About Us" },
  ];

  const dashboardNavigation = [
    { href: "/dashboard/profile", name: "Profile" },
    { href: "/dashboard/orders", name: "My Orders" },
  ];

  const isDashboard =
    user &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"));
  const navigation = mainNavigation;

  const isNavActive = (item: { href: string }) => {
    if (item.href === "/") return pathname === "/";
    if (item.href === "/products") return CATALOG_PATHS.includes(pathname);
    return pathname === item.href || pathname?.startsWith(`${item.href}/`);
  };

  const renderContent = () => (
    <header
      className={`
        sticky top-0 z-40 w-full border-b border-krs-navy-border bg-krs-navy
        text-krs-navy-foreground
      `}
      ref={headerRef}
    >
      <div
        className={`
          container mx-auto max-w-7xl px-4
          sm:px-6
          lg:px-8
        `}
      >
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              className={`
                text-krs-navy-foreground
                hover:bg-white/10
                md:hidden
              `}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              size="icon"
              variant="ghost"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          <Link
            className={`
              absolute left-1/2 flex -translate-x-1/2 items-center gap-2
              text-center
            `}
            href="/"
          >
            {settings.logoUrl ? (
              <span className="relative block h-8 w-8">
                <Image
                  alt={settings.name}
                  className="object-contain"
                  fill
                  sizes="32px"
                  src={settings.logoUrl}
                />
              </span>
            ) : null}
            <span className="font-display krs-brand-mark text-2xl">
              {settings.name}
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/products">
              <Button
                aria-label="Search the collection"
                className={`
                  text-krs-navy-foreground
                  hover:bg-white/10
                `}
                size="icon"
                variant="ghost"
              >
                <Search className="h-4 w-4" />
              </Button>
            </Link>

            {isPending ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : (
              <Cart />
            )}

            {isPending ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : (
              <NotificationsWidget />
            )}

            {showAuth &&
              (user ? (
                <div
                  className={`
                    hidden
                    md:block
                  `}
                >
                  <HeaderUserDropdown
                    isDashboard={!!isDashboard}
                    userEmail={user.email}
                    userImage={user.image}
                    userName={user.name}
                  />
                </div>
              ) : (
                <Link
                  className={`
                    hidden
                    md:block
                  `}
                  href="/auth/sign-in"
                >
                  <Button
                    className={`
                      text-krs-navy-foreground
                      hover:bg-white/10
                    `}
                    size="icon"
                    variant="ghost"
                  >
                    <User className="h-4 w-4" />
                    <span className="sr-only">Account</span>
                  </Button>
                </Link>
              ))}
          </div>
        </div>
      </div>

      <div className="border-t border-krs-navy-border">
        <nav
          className={`
            container mx-auto hidden max-w-7xl justify-center px-4 py-3
            md:flex
          `}
        >
          <ul
            className={`
              flex flex-wrap items-center justify-center gap-x-6 gap-y-2
            `}
          >
            {isPending
              ? Array.from({ length: navigation.length }).map((_, i) => (
                  <li key={i}>
                    <Skeleton className="h-4 w-20 bg-white/10" />
                  </li>
                ))
              : navigation.map((item) => {
                  const isActive = isNavActive(item);

                  return (
                    <li key={item.name}>
                      <Link
                        className={cn(
                          `
                            krs-ref text-[13px] transition-colors
                            hover:text-primary
                          `,
                          isActive
                            ? "text-primary"
                            : "text-krs-navy-foreground/80",
                        )}
                        href={item.href}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
          </ul>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className={`
            border-t border-krs-navy-border bg-krs-navy shadow-lg
            md:hidden
          `}
        >
          <div className="space-y-1 border-b border-krs-navy-border px-4 py-3">
            {isPending
              ? Array.from({ length: navigation.length }).map((_, i) => (
                  <div className="py-2" key={i}>
                    <Skeleton className="h-6 w-32 bg-white/10" />
                  </div>
                ))
              : navigation.map((item) => {
                  const isActive = isNavActive(item);

                  return (
                    <Link
                      className={cn(
                        `krs-ref block px-3 py-2 text-[13px]`,
                        isActive
                          ? "text-primary"
                          : `
                            text-krs-navy-foreground/80
                            hover:text-primary
                          `,
                      )}
                      href={item.href}
                      key={item.name}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  );
                })}
          </div>

          {showAuth && !user && (
            <div className="space-y-1 border-b border-krs-navy-border px-4 py-3">
              <Link
                className={`
                  block px-3 py-2 text-sm text-krs-navy-foreground/80
                  hover:text-primary
                `}
                href="/auth/sign-in"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                className={`
                  block border border-krs-navy-foreground/40 px-3 py-2
                  text-center text-sm text-krs-navy-foreground
                  hover:border-primary hover:text-primary
                `}
                href="/auth/sign-up"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          )}

          {showAuth && user && (
            <div className="space-y-1 px-4 py-3">
              {dashboardNavigation.map((item) => (
                <Link
                  className={`
                    block px-3 py-2 text-sm text-krs-navy-foreground/80
                    hover:text-primary
                  `}
                  href={item.href}
                  key={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                className={`
                  block px-3 py-2 text-sm text-krs-navy-foreground/80
                  hover:text-primary
                `}
                href="/auth/sign-out"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log out
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );

  return renderContent();
}
