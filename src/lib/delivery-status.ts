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

export const DELIVERY_STATUS_LABEL: Record<Inquiry["deliveryStatus"], string> =
  {
    confirmed: "Confirmed",
    delivered: "Delivered",
    out_for_delivery: "Out for Delivery",
    pending_review: "Pending Review",
    placed: "Order Placed",
    processing: "In the Workshop",
    shipped: "Shipped",
  };

export function getDeliveryStepIndex(
  status: Inquiry["deliveryStatus"],
): number {
  return DELIVERY_STEPS.indexOf(status);
}
