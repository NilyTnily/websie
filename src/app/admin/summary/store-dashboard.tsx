import { Flame, Package, Tags, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { Inquiry } from "~/db/schema";
import type { DashboardStats } from "~/lib/queries/dashboard";

import { cn } from "~/lib/cn";
import { formatOrderNumber } from "~/lib/order-number";
import { StatCardGrid } from "~/ui/components/admin/stat-card";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

const STATUS_LABEL: Record<Inquiry["status"], string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

const STATUS_BADGE_CLASS: Record<Inquiry["status"], string> = {
  approved: `
    border-green-200 bg-green-100 text-green-800
    dark:border-green-900 dark:bg-green-950/40 dark:text-green-400
  `,
  pending: `
    border-amber-200 bg-amber-100 text-amber-800
    dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400
  `,
  rejected: `
    border-red-200 bg-red-100 text-red-800
    dark:border-red-900 dark:bg-red-950/40 dark:text-red-400
  `,
};

interface StoreDashboardProps {
  stats: DashboardStats;
}

export function StoreDashboard({ stats }: StoreDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Store Overview</h2>
        <p className="text-sm text-muted-foreground">
          What's moving, what needs attention, and where the requested value
          stands.
        </p>
      </div>

      <StatCardGrid
        stats={[
          {
            label: "Approved Value",
            value: CURRENCY_FORMATTER.format(stats.approvedValue),
          },
          {
            label: "Total Requested",
            value: CURRENCY_FORMATTER.format(stats.totalRequestedValue),
          },
          { label: "Needs Review", value: stats.pendingCount },
          { label: "Products", value: stats.totalProducts },
          { label: "Out of Stock", value: stats.outOfStock },
          { label: "Featured", value: stats.featuredCount },
          { label: "Categories", value: stats.totalCategories },
          { label: "Customers", value: stats.totalUsers },
        ]}
      />

      <div
        className={`
          grid grid-cols-1 gap-6
          lg:grid-cols-2
        `}
      >
        <div className="space-y-3 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent Inquiries</h3>
            <Link
              className={`text-xs text-primary hover:underline`}
              href="/admin/inquiries"
            >
              View all
            </Link>
          </div>
          {stats.recentInquiries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inquiries yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentInquiries.map((inquiry) => (
                <li key={inquiry.id}>
                  <Link
                    className={`
                      flex items-center gap-3 rounded-md p-1.5
                      hover:bg-muted/50
                    `}
                    href={`/admin/inquiries/${inquiry.id}`}
                  >
                    <div
                      className={`
                        relative h-10 w-10 shrink-0 overflow-hidden rounded-md
                        border bg-muted
                      `}
                    >
                      {inquiry.items[0] && (
                        <Image
                          alt={inquiry.items[0].name}
                          className="object-cover"
                          fill
                          sizes="40px"
                          src={inquiry.items[0].image}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {inquiry.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatOrderNumber(inquiry.orderNumber)} ·{" "}
                        {DATE_FORMATTER.format(inquiry.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">
                        {CURRENCY_FORMATTER.format(inquiry.subtotal)}
                      </p>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          STATUS_BADGE_CLASS[inquiry.status],
                        )}
                      >
                        {STATUS_LABEL[inquiry.status]}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Most Requested Pieces</h3>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inquiries yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <li className="flex items-center gap-3" key={product.id}>
                  <span className="w-4 text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <div
                    className={`
                      relative h-10 w-10 shrink-0 overflow-hidden rounded-md
                      border bg-muted
                    `}
                  >
                    <Image
                      alt={product.name}
                      className="object-cover"
                      fill
                      sizes="40px"
                      src={product.image}
                    />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {product.name}
                  </p>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {product.requestCount}× requested
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div
        className={`
          grid grid-cols-2 gap-2 text-xs text-muted-foreground
          sm:grid-cols-4
        `}
      >
        <span className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" />
          {stats.totalProducts} products across {stats.totalCategories}{" "}
          categories
        </span>
        <span className="flex items-center gap-1.5">
          <Tags className="h-3.5 w-3.5" />
          {stats.featuredCount} featured on homepage
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {stats.totalUsers} registered customers
        </span>
      </div>
    </div>
  );
}
