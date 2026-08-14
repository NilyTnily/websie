import "server-only";

import type { InquiryItem } from "~/db/schema";

import { getSiteSettings } from "~/lib/queries/settings";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

interface InquiryMessageInput {
  customerContact: string;
  customerName: string;
  items: InquiryItem[];
  note?: string;
  subtotal: number;
}

export function buildInquiryMessage(input: InquiryMessageInput): string {
  const lines = [
    "New inquiry from the KRS website",
    "",
    ...input.items.map(
      (item) =>
        `• ${item.name} x${item.quantity} — ${CURRENCY_FORMATTER.format(item.price * item.quantity)}`,
    ),
    "",
    `Subtotal: ${CURRENCY_FORMATTER.format(input.subtotal)}`,
    "",
    `From: ${input.customerName}`,
    `Contact: ${input.customerContact}`,
  ];

  if (input.note) {
    lines.push("", `Note: ${input.note}`);
  }

  return lines.join("\n");
}

/** Returns null when no WhatsApp number is configured, so callers can fall back gracefully. */
export async function buildWhatsAppLink(
  message: string,
): Promise<null | string> {
  const settings = await getSiteSettings();
  const rawNumber = settings.whatsappNumber ?? process.env.WHATSAPP_NUMBER;
  if (!rawNumber) return null;

  const digits = rawNumber.replace(/\D/g, "");
  if (!digits) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
