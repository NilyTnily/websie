"use server";

import type { InquiryItem } from "~/db/schema";

import { getCurrentUser } from "~/lib/auth";
import { createInquiry } from "~/lib/queries/inquiries";
import { getSiteSettings } from "~/lib/queries/settings";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit";
import { buildInquiryMessage, buildWhatsAppLink } from "~/lib/whatsapp";

const INQUIRY_RATE_LIMIT_MAX = 5;
const INQUIRY_RATE_LIMIT_WINDOW_MS = 60_000;

export interface SubmitInquiryInput {
  customerContact: string;
  customerName: string;
  items: InquiryItem[];
  note?: string;
}

export type SubmitInquiryResult =
  | { error: string; success: false }
  | { success: true; whatsappUrl: null | string };

export async function submitInquiryAction(
  input: SubmitInquiryInput,
): Promise<SubmitInquiryResult> {
  const customerName = input.customerName.trim();
  const customerContact = input.customerContact.trim();
  const note = input.note?.trim() || undefined;

  if (!customerName || !customerContact) {
    return {
      error: "Please add your name and a way to reach you.",
      success: false,
    };
  }
  if (input.items.length === 0) {
    return { error: "Your bag is empty.", success: false };
  }

  const ip = await getClientIp();
  const allowed = await checkRateLimit(
    `inquiry:${ip}`,
    INQUIRY_RATE_LIMIT_MAX,
    INQUIRY_RATE_LIMIT_WINDOW_MS,
  );
  if (!allowed) {
    return {
      error: "Too many requests — please wait a minute and try again.",
      success: false,
    };
  }

  try {
    const [user, settings] = await Promise.all([
      getCurrentUser(),
      getSiteSettings(),
    ]);
    const inquiry = await createInquiry({
      customerContact,
      customerName,
      items: input.items,
      note,
      userId: user?.id,
    });
    const message = buildInquiryMessage({
      customerContact,
      customerName,
      hidePrices: settings.noMoneyMode,
      items: input.items,
      note,
      subtotal: inquiry.subtotal,
    });
    return { success: true, whatsappUrl: await buildWhatsAppLink(message) };
  } catch (error) {
    console.error("Failed to submit inquiry:", error);
    return {
      error: "Something went wrong — please try again.",
      success: false,
    };
  }
}
