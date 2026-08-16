"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/cn";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const TABS = [
  { href: "/dashboard", label: "My pieces" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/certificates", label: "Certificates" },
  { href: "/dashboard/saved", label: "Saved" },
  { href: "/dashboard/profile", label: "Details" },
];

interface DashboardShellProps {
  children: React.ReactNode;
  clientSince: Date;
  insuredValue: number;
  orderCount: number;
  pieceCount: number;
}

export function DashboardShell({
  children,
  clientSince,
  insuredValue,
  orderCount,
  pieceCount,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="bg-krs-ivory-bright">
      <div
        className={`
          container mx-auto max-w-7xl px-4 py-14
          sm:px-6
        `}
      >
        <div
          className={`
            flex flex-col gap-6 border-b border-border pb-6
            sm:flex-row sm:items-end sm:justify-between
          `}
        >
          <div>
            <p className="krs-eyebrow text-krs-tobacco">
              Client since {clientSince.getFullYear()} · {pieceCount} piece
              {pieceCount === 1 ? "" : "s"}
            </p>
            <h1 className="mt-3 font-display text-4xl text-foreground">
              The Vault
            </h1>
          </div>
          <div className="flex gap-10 text-right">
            <div>
              <p className="krs-price text-2xl text-foreground">
                {CURRENCY_FORMATTER.format(insuredValue)}
              </p>
              <p className="krs-meta mt-1.5 text-muted-foreground">
                Insured value
              </p>
            </div>
            <div>
              <p className="krs-price text-2xl text-foreground">
                {orderCount}
              </p>
              <p className="krs-meta mt-1.5 text-muted-foreground">Orders</p>
            </div>
          </div>
        </div>

        <nav className="mt-7 flex gap-8 overflow-x-auto text-xs">
          {TABS.map((tab) => {
            const isActive =
              tab.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname?.startsWith(tab.href);
            return (
              <Link
                className={cn(
                  "krs-label shrink-0 border-b pb-2.5",
                  isActive
                    ? "border-krs-champagne text-foreground"
                    : `
                      border-transparent text-krs-ash
                      hover:text-foreground
                    `,
                )}
                href={tab.href}
                key={tab.href}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`
        container mx-auto max-w-7xl px-4 pb-20
        sm:px-6
      `}>
        {children}
      </div>
    </div>
  );
}
