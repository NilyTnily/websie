import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUserOrRedirect } from "~/lib/auth";
import { DELIVERY_STATUS_LABEL } from "~/lib/delivery-status";
import { formatOrderNumber } from "~/lib/order-number";
import { getInquiryByIdForUser } from "~/lib/queries/inquiries";
import { OrderProgressTracker } from "~/ui/components/order-progress-tracker";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUserOrRedirect();
  if (!user) return null;

  const order = await getInquiryByIdForUser(id, user.id);
  if (!order) notFound();

  return (
    <div
      className={`
        container space-y-10 p-4
        md:p-8
      `}
    >
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link
          className={`
            text-muted-foreground
            hover:text-foreground
          `}
          href="/dashboard/orders"
        >
          My Orders
        </Link>
        <span className="mx-1.5 text-muted-foreground">/</span>
        <span className="text-foreground">
          {formatOrderNumber(order.orderNumber)}
        </span>
      </nav>

      <div
        className={`
          flex flex-col gap-1
          sm:flex-row sm:items-center sm:justify-between
        `}
      >
        <div>
          <h1 className="font-display text-2xl text-foreground">
            Order {formatOrderNumber(order.orderNumber)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {DATE_FORMATTER.format(order.createdAt)}
          </p>
        </div>
        <span className="krs-ref text-xs text-primary">
          {DELIVERY_STATUS_LABEL[order.deliveryStatus]}
        </span>
      </div>

      <section className="border border-border p-6">
        <h2 className="krs-ref text-xs text-muted-foreground">
          Delivery Status
        </h2>
        <div className="mt-6">
          <OrderProgressTracker
            carrier={order.carrier}
            deliveryStatus={order.deliveryStatus}
            trackingUrl={order.trackingUrl}
          />
        </div>
      </section>

      <section>
        <h2 className="krs-ref text-xs text-muted-foreground">Your Bag</h2>
        <ul
          className={`
            mt-4 divide-y divide-border border-t border-b border-border
          `}
        >
          {order.items.map((item) => (
            <li className="flex items-center gap-4 py-4" key={item.id}>
              <div
                className={`
                  relative h-16 w-16 shrink-0 overflow-hidden bg-muted
                `}
              >
                <Image
                  alt={item.name}
                  className="object-cover"
                  fill
                  sizes="64px"
                  src={item.image}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Qty {item.quantity}
                </p>
              </div>
              <p className="krs-ref text-sm text-foreground">
                {CURRENCY_FORMATTER.format(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Subtotal
          </span>
          <span className="krs-ref text-sm font-semibold text-foreground">
            {CURRENCY_FORMATTER.format(order.subtotal)}
          </span>
        </div>
      </section>

      {order.note && (
        <section>
          <h2 className="krs-ref text-xs text-muted-foreground">Your Note</h2>
          <p className="mt-3 text-sm text-muted-foreground">{order.note}</p>
        </section>
      )}
    </div>
  );
}
