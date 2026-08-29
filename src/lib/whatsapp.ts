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
  /** Omits per-item and subtotal price lines — set when No Money Mode is on. */
  hidePrices?: boolean;
  items: InquiryItem[];
  note?: string;
  subtotal: number;
}

export function buildInquiryMessage(input: InquiryMessageInput): string {
  const lines = [
    "New inquiry from the KRS website",
    "",
    ...input.items.map((item) =>
      input.hidePrices
        ? `• ${item.name} x${item.quantity}`
        : `• ${item.name} x${item.quantity} — ${CURRENCY_FORMATTER.format(item.price * item.quantity)}`,
    ),
  ];

  if (!input.hidePrices) {
    lines.push(
      "",
      `Subtotal: ${CURRENCY_FORMATTER.format(input.subtotal)}`,
    );
  }

  lines.push("", `From: ${input.customerName}`, `Contact: ${input.customerContact}`);

  if (input.note) {
    lines.push("", `Note: ${input.note}`);
  }

  return lines.join("\n");
}

/** Returns null when no WhatsApp number is configured, so callers can fall back gracefully. */
export async function buildWhatsAppLink(
  message: string,
  whatsappNumber?: null | string,
): Promise<null | string> {
  let rawNumber = whatsappNumber;
  if (rawNumber === undefined) {
    const settings = await getSiteSettings();
    rawNumber = settings.whatsappNumber ?? process.env.WHATSAPP_NUMBER;
  } else {
    rawNumber = rawNumber ?? process.env.WHATSAPP_NUMBER;
  }
  if (!rawNumber) return null;

  const digits = rawNumber.replace(/\D/g, "");
  if (!digits) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Sync version when caller already has settings — avoids extra DB hit */
export function buildWhatsAppLinkSync(
  message: string,
  whatsappNumber: null | string | undefined,
): null | string {
  const rawNumber = whatsappNumber ?? process.env.WHATSAPP_NUMBER;
  if (!rawNumber) return null;
  const digits = rawNumber.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
