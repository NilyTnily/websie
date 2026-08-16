"use server";

import type { InquiryDeliveryAddress, InquiryItem } from "~/db/schema";

import { getCurrentUser } from "~/lib/auth";
import {
  DELIVERY_METHODS,
  ENGRAVING_MAX_LENGTH,
  PRESENTATION_OPTIONS,
} from "~/lib/checkout-options";
import { createInquiry } from "~/lib/queries/inquiries";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit";
import { buildInquiryMessage, buildWhatsAppLink } from "~/lib/whatsapp";

const CHECKOUT_RATE_LIMIT_MAX = 5;
const CHECKOUT_RATE_LIMIT_WINDOW_MS = 60_000;

export interface CheckoutInput {
  customerContact: string;
  deliveryAddress: InquiryDeliveryAddress;
  deliveryMethod: string;
  engravingText?: string;
  items: InquiryItem[];
  presentationOption: string;
}

export type CheckoutResult =
  | { error: string; success: false }
  | { success: true; whatsappUrl: null | string };

export async function checkoutAction(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const customerContact = input.customerContact.trim();
  const address: InquiryDeliveryAddress = {
    city: input.deliveryAddress.city.trim(),
    name: input.deliveryAddress.name.trim(),
    postcode: input.deliveryAddress.postcode.trim(),
    street: input.deliveryAddress.street.trim(),
  };

  if (!customerContact) {
    return { error: "Add an email or phone number so we can reach you.", success: false };
  }
  if (!address.name || !address.street || !address.city || !address.postcode) {
    return { error: "Please complete the delivery address.", success: false };
  }
  if (input.items.length === 0) {
    return { error: "Your bag is empty.", success: false };
  }

  const delivery = DELIVERY_METHODS.find((m) => m.value === input.deliveryMethod);
  if (!delivery) {
    return { error: "Choose a delivery method.", success: false };
  }
  const presentation = PRESENTATION_OPTIONS.find(
    (p) => p.value === input.presentationOption,
  );
  if (!presentation) {
    return { error: "Choose a presentation option.", success: false };
  }
  const engravingText = input.engravingText?.trim().slice(0, ENGRAVING_MAX_LENGTH);
  if (presentation.value === "engraving" && !engravingText) {
    return { error: "Add the engraving text.", success: false };
  }

  const ip = await getClientIp();
  const allowed = await checkRateLimit(
    `checkout:${ip}`,
    CHECKOUT_RATE_LIMIT_MAX,
    CHECKOUT_RATE_LIMIT_WINDOW_MS,
  );
  if (!allowed) {
    return {
      error: "Too many requests — please wait a minute and try again.",
      success: false,
    };
  }

  try {
    const user = await getCurrentUser();
    const inquiry = await createInquiry({
      customerContact,
      customerName: address.name,
      deliveryAddress: address,
      deliveryCost: delivery.cost,
      deliveryMethod: delivery.value,
      engravingText: presentation.value === "engraving" ? engravingText : undefined,
      items: input.items,
      presentationCost: presentation.cost,
      presentationOption: presentation.value,
      userId: user?.id,
    });
    const message = buildInquiryMessage({
      customerContact,
      customerName: address.name,
      items: input.items,
      note: `Delivery: ${delivery.label} (${delivery.cost ? `$${delivery.cost}` : "Included"}). Presentation: ${presentation.label}${engravingText ? ` — "${engravingText}"` : ""}. Ship to: ${address.street}, ${address.city} ${address.postcode}.`,
      subtotal: inquiry.subtotal,
    });
    return { success: true, whatsappUrl: await buildWhatsAppLink(message) };
  } catch (error) {
    console.error("Failed to submit checkout:", error);
    return {
      error: "Something went wrong — please try again.",
      success: false,
    };
  }
}
