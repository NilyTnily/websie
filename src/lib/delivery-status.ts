import type { Inquiry } from "~/db/schema";

// Order matters — the progress tracker derives "how far along" a status is
// from its position in this list.
export const DELIVERY_STEPS: Inquiry["deliveryStatus"][] = [
  "pending_review",
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

// Terminal exceptions — deliberately excluded from DELIVERY_STEPS since they
// aren't a point on the linear progress sequence, just an end state that can
// be reached from any stage.
export const TERMINAL_DELIVERY_STATUSES: Inquiry["deliveryStatus"][] = [
  "cancelled",
  "refunded",
];

export function isTerminalDeliveryStatus(
  status: Inquiry["deliveryStatus"],
): boolean {
  return TERMINAL_DELIVERY_STATUSES.includes(status);
}

export const DELIVERY_STATUS_LABEL: Record<Inquiry["deliveryStatus"], string> =
  {
    cancelled: "Cancelled",
    confirmed: "Confirmed",
    delivered: "Delivered",
    out_for_delivery: "Out for Delivery",
    pending_review: "Pending Review",
    placed: "Order Placed",
    processing: "In the Workshop",
    refunded: "Refunded",
    shipped: "Shipped",
  };

export function getDeliveryStepIndex(
  status: Inquiry["deliveryStatus"],
): number {
  return DELIVERY_STEPS.indexOf(status);
}

export const MAX_PENDING_ORDERS = 3;

/**
 * "Pending" for the user-facing limit + cancel rule.
 * Initial implementation: only `pending_review` — the state before any
 * staff action — counts as pending and is cancellable by the customer.
 * If the business later wants `placed` to also count, add it here.
 */
export const PENDING_DELIVERY_STATUSES: Inquiry["deliveryStatus"][] = [
  "pending_review",
];

export function isPendingDeliveryStatus(
  status: Inquiry["deliveryStatus"],
): boolean {
  return PENDING_DELIVERY_STATUSES.includes(status);
}

export function isCancellableDeliveryStatus(
  status: Inquiry["deliveryStatus"],
): boolean {
  return isPendingDeliveryStatus(status);
}
