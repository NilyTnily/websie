import Image from "next/image";
import Link from "next/link";

import type { Inquiry } from "~/db/schema";

import {
  DELIVERY_STATUS_LABEL,
  isCancellableDeliveryStatus,
} from "~/lib/delivery-status";
import { formatOrderNumber } from "~/lib/order-number";

import { CancelOrderButton } from "./cancel-order-button";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

interface OrderCardProps {
  order: Inquiry;
}

export function OrderCard({ order }: OrderCardProps) {
  const canCancel = isCancellableDeliveryStatus(order.deliveryStatus);
  return (
    <div
      className={`
        group flex flex-col border border-border transition-colors
        hover:border-primary
      `}
    >
      <Link
        className="block p-4"
        href={`/dashboard/orders/${order.id}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="krs-ref text-xs text-primary">
              Order {formatOrderNumber(order.orderNumber)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {DATE_FORMATTER.format(order.createdAt)}
            </p>
          </div>
          <span className={`krs-ref shrink-0 text-[10px] text-muted-foreground`}>
            {DELIVERY_STATUS_LABEL[order.deliveryStatus]}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-3">
            {order.items.slice(0, 4).map((item) => (
              <div
                className={`
                  relative h-12 w-12 overflow-hidden border-2 border-background
                  bg-muted
                `}
                key={item.id}
              >
                <Image
                  alt={item.name}
                  className="object-cover"
                  fill
                  sizes="48px"
                  src={item.image}
                />
              </div>
            ))}
            {order.items.length > 4 && (
              <div
                className={`
                  flex h-12 w-12 items-center justify-center border-2
                  border-background bg-muted text-xs text-muted-foreground
                `}
              >
                +{order.items.length - 4}
              </div>
            )}
          </div>
          <p className="krs-ref text-sm font-semibold text-foreground">
            {CURRENCY_FORMATTER.format(order.subtotal)}
          </p>
        </div>
      </Link>
      {canCancel && (
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2">
          <span className="text-[11px] text-muted-foreground">
            Pending — can be cancelled
          </span>
          <CancelOrderButton
            orderId={order.id}
            orderNumber={formatOrderNumber(order.orderNumber)}
            variant="card"
          />
        </div>
      )}
    </div>
  );
}
