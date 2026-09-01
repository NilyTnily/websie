"use client";

import { House, Loader2, Menu, Search, UserIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { cn } from "~/lib/cn";
import { useSiteSettings } from "~/lib/hooks/use-site-settings";
import { Cart } from "~/ui/components/cart";

import { HeaderUserDropdown } from "./header-user";

interface HeaderProps {
  children?: React.ReactNode;
  isAdmin?: boolean;
  showAuth?: boolean;
  // Resolved server-side (see layout.tsx / app/page.tsx), via the same
  // real DB-backed session check admin gating and every protected route
  // already use — not the client-only `useSession()` hook, which can
  // report "no user" even on a genuinely signed-in browser (a stale/slow
  // client fetch, a base-URL mismatch, etc.) and was why the header kept
  // showing the "Sign in" button to already-signed-in visitors.
  user: null | { email: string; image?: null | string; name: string };
}

export function Header(props: HeaderProps) {
  return <HeaderContent {...props} />;
}

const mainNavigation = [
  { href: "/watches", name: "Watches" },
  { href: "/jewelry", name: "Jewelry" },
];

const dashboardNavigation = [
  { href: "/dashboard/profile", name: "Profile" },
  { href: "/dashboard/orders", name: "My Orders" },
  { href: "/dashboard/saved", name: "Favorites" },
];

const UTILITY_LINK = `
  krs-label hidden text-krs-navy-foreground/72 transition-colors
  hover:text-krs-champagne
  md:inline
`;

function HeaderContent({ isAdmin = false, showAuth = true, user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const settings = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [authNavPending, startAuthNav] = useTransition();
  const headerRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isHome = pathname === "/";

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setSearchValue("");
  }

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
      className={cn(
        `sticky top-0 z-40 w-full bg-krs-navy text-krs-navy-foreground`,
        // The hero flythrough's fixed-position scene overlays (table watch
        // cutouts, .sw-topbar) sit at z-45/z-50 — above the header's normal
        // z-40 — so the mobile menu needs to jump above those too while open,
        // or it renders underneath whatever hero layer is currently visible.
        mobileMenuOpen && "z-[60]",
      )}
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
              relative text-krs-navy-foreground
              before:absolute before:-inset-3 before:content-['']
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
            {searchOpen ? (
              <form
                className={`
                  hidden items-center border-b border-krs-champagne/40
                  md:flex
                `}
                onSubmit={submitSearch}
              >
                <input
                  aria-label="Search products"
                  className={`
                    h-8 w-40 bg-transparent text-sm text-krs-navy-foreground
                    outline-none
                    placeholder:text-krs-navy-foreground/50
                  `}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search…"
                  ref={searchInputRef}
                  type="search"
                  value={searchValue}
                />
                <button
                  aria-label="Close search"
                  className={`
                    text-krs-navy-foreground/72
                    hover:text-krs-champagne
                  `}
                  onClick={() => setSearchOpen(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                aria-label="Search"
                className={`
                  hidden text-krs-navy-foreground/72 transition-colors
                  hover:text-krs-champagne
                  md:inline-flex
                `}
                onClick={() => setSearchOpen(true)}
                type="button"
              >
                <Search className="h-4 w-4" />
              </button>
            )}

            <Link aria-label="The House" className={UTILITY_LINK} href="/about">
              <House className="h-4 w-4" />
            </Link>

            <Cart />

            {user ? (
              <HeaderUserDropdown
                isAdmin={isAdmin}
                isDashboard={!!isDashboard}
                userEmail={user.email}
                userImage={user.image}
                userName={user.name}
              />
            ) : (
              showAuth && (
                <button
                  aria-label="Account"
                  className={`
                    flex h-9 w-9 items-center justify-center rounded-full border
                    border-white/10 bg-white/5 text-krs-navy-foreground
                    transition-colors
                    hover:bg-white/10 hover:text-primary
                    disabled:pointer-events-none disabled:opacity-70
                  `}
                  disabled={authNavPending}
                  onClick={() =>
                    startAuthNav(() => router.push("/auth/sign-in"))
                  }
                  title="Sign in"
                  type="button"
                >
                  {authNavPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserIcon className="h-4 w-4" />
                  )}
                </button>
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

      {/* Mobile menu — absolutely positioned so it overlays the page instead
          of sitting in the header's normal flow. In-flow would grow
          header.offsetHeight while open, and the ResizeObserver above feeds
          that height into --header-height, which the hero flythrough uses
          to size/position itself — so opening the menu would visibly shove
          the hero video down each time. Overlaying keeps the header's own
          measured height constant regardless of menu state. */}
      {mobileMenuOpen && (
        <div
          className={`
            absolute inset-x-0 top-full max-h-[calc(100dvh-100%)]
            overflow-y-auto border-t border-krs-navy-border bg-krs-navy
            shadow-lg
            md:hidden
          `}
        >
          <form
            className="flex items-center gap-2 border-b border-krs-navy-border px-6 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = searchValue.trim();
              if (!trimmed) return;
              setMobileMenuOpen(false);
              router.push(`/products?search=${encodeURIComponent(trimmed)}`);
              setSearchValue("");
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-krs-navy-foreground/50" />
              <input
                aria-label="Search products"
                className="h-10 w-full border border-krs-navy-border bg-transparent pr-3 pl-9 text-sm text-krs-navy-foreground outline-none placeholder:text-krs-navy-foreground/50 focus:border-krs-champagne"
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search Rolex, Patek, reference…"
                type="search"
                value={searchValue}
              />
            </div>
            <button
              aria-label="Search"
              className="flex h-10 w-10 shrink-0 items-center justify-center bg-krs-champagne text-krs-navy transition-colors hover:bg-krs-champagne-light"
              type="submit"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
          <div className="space-y-1 border-b border-krs-navy-border px-6 py-4">
            {mainNavigation.map((item) => {
              const isActive = isNavActive(item);

              return (
                <Link
                  className={cn(
                    `krs-label block py-3`,
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
                krs-label block py-3 text-krs-navy-foreground/72
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
              {isAdmin && (
                <Link
                  className={`
                    block py-2 text-sm text-krs-navy-foreground/80
                    hover:text-krs-champagne
                  `}
                  href="/admin/summary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
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
