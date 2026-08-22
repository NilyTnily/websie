"use client";

import { Menu, UserIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { useCurrentUser } from "~/lib/auth-client";
import { cn } from "~/lib/cn";
import { useSiteSettings } from "~/lib/hooks/use-site-settings";
import { Cart } from "~/ui/components/cart";
import { Skeleton } from "~/ui/primitives/skeleton";

import { NotificationsWidget } from "../notifications/notifications-widget";
import { HeaderUserDropdown } from "./header-user";

interface HeaderProps {
  children?: React.ReactNode;
  showAuth?: boolean;
}

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-40 w-full bg-krs-navy text-krs-navy-foreground">
      <div className="mx-auto max-w-7xl px-6 py-5 sm:px-14 sm:py-[26px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24 bg-white/10" />
          <Skeleton className="h-6 w-16 bg-white/10" />
        </div>
      </div>
      <div className="border-t border-krs-navy-border" />
    </header>
  );
}

export function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <HeaderContent {...props} />
    </Suspense>
  );
}

const mainNavigation = [
  { href: "/watches", name: "Watches" },
  { href: "/jewelry", name: "Jewelry" },
];

const dashboardNavigation = [
  { href: "/dashboard/profile", name: "Profile" },
  { href: "/dashboard/orders", name: "My Orders" },
];

const UTILITY_LINK = `
  krs-label hidden text-krs-navy-foreground/72 transition-colors
  hover:text-krs-champagne
  md:inline
`;

function HeaderContent({ showAuth = true }: HeaderProps) {
  const pathname = usePathname();
  const { isPending, user } = useCurrentUser();
  const settings = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const isHome = pathname === "/";

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

  const isDashboard =
    user &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"));

  const isNavActive = (item: { href: string }) =>
    pathname === item.href || pathname?.startsWith(`${item.href}/`);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-krs-navy text-krs-navy-foreground`}
      ref={headerRef}
    >
      <div
        className={`
          mx-auto max-w-7xl px-6 py-5
          sm:px-14 sm:py-[26px]
        `}
      >
        <div className="relative flex items-center justify-between">
          <button
            aria-label="Open menu"
            className={`
              text-krs-navy-foreground
              md:hidden
            `}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <nav
            className={`
              hidden gap-8
              md:flex
            `}
          >
            {mainNavigation.map((item) => (
              <Link
                className={cn(
                  "krs-label transition-colors",
                  isNavActive(item)
                    ? "text-krs-champagne"
                    : `
                      text-krs-navy-foreground/72
                      hover:text-krs-champagne
                    `,
                )}
                href={item.href}
                key={item.href}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <Link className="absolute left-1/2 -translate-x-1/2" href="/">
            <span
              className={`
                krs-brand-mark font-display text-xl
                sm:text-[27px]
              `}
            >
              {settings.name}
            </span>
          </Link>

          <div
            className={`
              flex items-center gap-5
              sm:gap-[30px]
            `}
          >
            <Link className={UTILITY_LINK} href="/about">
              The House
            </Link>
            {isHome && (
              <Link className={UTILITY_LINK} href="/products">
                Browse
              </Link>
            )}

            {isPending ? (
              <Skeleton className="h-4 w-10 bg-white/10" />
            ) : (
              <Cart />
            )}

            {isPending ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : (
              <NotificationsWidget />
            )}

            {isPending ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : user ? (
              <HeaderUserDropdown
                isDashboard={!!isDashboard}
                userEmail={user.email}
                userImage={user.image}
                userName={user.name}
              />
            ) : (
              showAuth && (
                <Link
                  aria-label="Account"
                  className={`
                    flex h-9 w-9 items-center justify-center rounded-full
                    border border-white/10 bg-white/5
                    text-krs-navy-foreground transition-colors
                    hover:bg-white/10 hover:text-primary
                  `}
                  href="/auth/sign-in"
                  title="Sign in"
                >
                  <UserIcon className="h-4 w-4" />
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {isHome ? (
        <div
          aria-hidden="true"
          className="h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(200,169,126,.45) 20%, rgba(200,169,126,.45) 80%, transparent)",
          }}
        />
      ) : (
        <div className="border-t border-krs-navy-border" />
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className={`
            border-t border-krs-navy-border bg-krs-navy shadow-lg
            md:hidden
          `}
        >
          <div className="space-y-1 border-b border-krs-navy-border px-6 py-4">
            {mainNavigation.map((item) => {
              const isActive = isNavActive(item);

              return (
                <Link
                  className={cn(
                    `krs-label block py-2`,
                    isActive
                      ? "text-krs-champagne"
                      : `
                        text-krs-navy-foreground/72
                        hover:text-krs-champagne
                      `,
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
            <Link
              className={`
                krs-label block py-2 text-krs-navy-foreground/72
                hover:text-krs-champagne
              `}
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
            >
              The House
            </Link>
          </div>

          {showAuth && !user && (
            <div className="space-y-1 border-b border-krs-navy-border px-6 py-4">
              <Link
                className={`
                  block py-2 text-sm text-krs-navy-foreground/80
                  hover:text-krs-champagne
                `}
                href="/auth/sign-in"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                className={`
                  mt-2 block border border-krs-navy-foreground/40 px-3 py-2
                  text-center text-sm text-krs-navy-foreground
                  hover:border-krs-champagne hover:text-krs-champagne
                `}
                href="/auth/sign-up"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          )}

          {showAuth && user && (
            <div className="space-y-1 px-6 py-4">
              {dashboardNavigation.map((item) => (
                <Link
                  className={`
                    block py-2 text-sm text-krs-navy-foreground/80
                    hover:text-krs-champagne
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
                  block py-2 text-sm text-krs-navy-foreground/80
                  hover:text-krs-champagne
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
}
