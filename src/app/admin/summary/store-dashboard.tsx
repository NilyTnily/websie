import Image from "next/image";
import Link from "next/link";

import type { Inquiry } from "~/db/schema";
import type {
  DashboardStats,
  InquiriesAging,
  QueueItem,
  RevenueDelta,
} from "~/lib/queries/dashboard";

import { cn } from "~/lib/cn";
import { formatOrderNumber } from "~/lib/order-number";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
});

const STATUS_LABEL: Record<Inquiry["status"], string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

interface StoreDashboardProps {
  awaitingDispatch: number;
  inquiriesAging: InquiriesAging;
  needsYouFirst: QueueItem[];
  revenueDelta: RevenueDelta;
  stats: DashboardStats;
}

export function StoreDashboard({
  awaitingDispatch,
  inquiriesAging,
  needsYouFirst,
  revenueDelta,
  stats,
}: StoreDashboardProps) {
  const statCards = [
    {
      delta:
        revenueDelta.percentChange === null
          ? null
          : `${revenueDelta.percentChange >= 0 ? "+" : ""}${revenueDelta.percentChange}% vs. prior`,
      label: "Revenue · 30 days",
      value: CURRENCY_FORMATTER.format(revenueDelta.currentValue),
    },
    {
      delta: `${stats.pendingCount} awaiting review`,
      label: "Awaiting dispatch",
      value: String(awaitingDispatch),
    },
    {
      delta:
        inquiriesAging.count > 0
          ? `Oldest ${inquiriesAging.oldestDays} day${inquiriesAging.oldestDays === 1 ? "" : "s"}`
          : null,
      label: "Inquiries aging",
      value: String(inquiriesAging.count),
    },
    {
      delta: `${stats.featuredCount} featured`,
      label: "Out of stock",
      value: String(stats.outOfStock),
    },
  ];

  return (
    <div className={`
      -m-4 bg-krs-onyx-card px-4 py-10 text-krs-ivory
      md:-m-6 md:px-10
    `}>
      <div
        className={`
          flex flex-col gap-4 border-b border-krs-ivory/12 pb-6
          sm:flex-row sm:items-end sm:justify-between
        `}
      >
        <div>
          <p className="krs-eyebrow text-krs-champagne">
            {DATE_FORMATTER.format(new Date())}
          </p>
          <h1 className="mt-3 font-display text-3xl text-krs-ivory">
            Today on the floor
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            className={`
              flex h-[42px] items-center bg-krs-champagne px-5 text-xs
              font-semibold tracking-[0.18em] text-krs-mocha uppercase
              hover:bg-krs-champagne-light
            `}
            href="/admin/products/new"
          >
            Add piece
          </Link>
        </div>
      </div>

      <div className={`
        mt-8 grid grid-cols-1 gap-px bg-krs-champagne/20
        sm:grid-cols-2
        lg:grid-cols-4
      `}>
        {statCards.map((card) => (
          <div className="bg-krs-onyx-card p-6" key={card.label}>
            <p className="krs-meta text-krs-ivory/50">{card.label}</p>
            <p className="mt-3 font-display text-3xl text-krs-ivory">
              {card.value}
            </p>
            {card.delta && (
              <p className="mt-1.5 text-xs text-krs-champagne">
                {card.delta}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className={`
        mt-7 grid grid-cols-1 gap-6
        lg:grid-cols-[1.6fr_1fr]
      `}>
        <div className="border border-krs-ivory/12">
          <div className={`
            krs-label border-b border-krs-ivory/12 px-6 py-4 text-krs-champagne
          `}>
            Needs you first
          </div>
          {needsYouFirst.length === 0 ? (
            <p className="p-6 text-sm text-krs-ivory/50">
              Nothing needs attention right now.
            </p>
          ) : (
            needsYouFirst.map((item, i) => (
              <Link
                className={cn(
                  `
                    flex items-center gap-5 border-krs-ivory/7 px-6 py-4
                    hover:bg-krs-ivory/5
                  `,
                  i < needsYouFirst.length - 1 && "border-b",
                )}
                href={item.href}
                key={`${item.title}-${i}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{item.title}</p>
                  <p className="mt-1 text-xs font-light text-krs-ivory/50">
                    {item.meta}
                  </p>
                </div>
                <span
                  className="krs-meta shrink-0 border px-2.5 py-1 text-[10px]"
                  style={{ borderColor: item.tagColor, color: item.tagColor }}
                >
                  {item.tag}
                </span>
                <span className="krs-meta shrink-0 text-krs-champagne">
                  Open
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="border border-krs-ivory/12 p-6">
          <p className="krs-label text-krs-champagne">Moving fastest</p>
          <div className="mt-6 grid gap-5">
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-krs-ivory/50">No inquiries yet.</p>
            ) : (
              stats.topProducts.map((product) => {
                const max = stats.topProducts[0]?.requestCount || 1;
                const pct = Math.round((product.requestCount / max) * 100);
                return (
                  <div key={product.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{product.name}</span>
                      <span className="shrink-0 pl-2 text-krs-ivory/55">
                        {product.requestCount}×
                      </span>
                    </div>
                    <div className="mt-2 h-[2px] bg-krs-ivory/12">
                      <div
                        className="h-[2px] bg-krs-champagne"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-7 border border-krs-ivory/12">
        <div className={`
          krs-label border-b border-krs-ivory/12 px-6 py-4 text-krs-champagne
        `}>
          Recent inquiries
        </div>
        {stats.recentInquiries.length === 0 ? (
          <p className="p-6 text-sm text-krs-ivory/50">No inquiries yet.</p>
        ) : (
          stats.recentInquiries.map((inquiry, i) => (
            <Link
              className={cn(
                `
                  flex items-center gap-4 border-krs-ivory/7 px-6 py-4
                  hover:bg-krs-ivory/5
                `,
                i < stats.recentInquiries.length - 1 && "border-b",
              )}
              href={`/admin/inquiries/${inquiry.id}`}
              key={inquiry.id}
            >
              <div className={`
                relative h-10 w-10 shrink-0 overflow-hidden bg-krs-mocha-tint
              `}>
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
                <p className="truncate text-sm">{inquiry.customerName}</p>
                <p className="krs-meta mt-1 text-krs-ivory/50">
                  {formatOrderNumber(inquiry.orderNumber)}
                </p>
              </div>
              <p className="krs-price shrink-0 text-sm">
                {CURRENCY_FORMATTER.format(inquiry.subtotal)}
              </p>
              <span className="krs-meta shrink-0 text-krs-ivory/50">
                {STATUS_LABEL[inquiry.status]}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
