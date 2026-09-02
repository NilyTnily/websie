import "server-only";
import { createId } from "@paralleldrive/cuid2";

import type { Inquiry } from "~/db/schema";

import { db } from "~/db";
import { whatsappMessageTable } from "~/db/schema";
import { formatOrderNumber } from "~/lib/order-number";
import {
  getWhatsAppCredentials,
  getWhatsAppTemplateBodies,
  getWhatsAppTemplateNames,
} from "~/lib/queries/integrations";
import { sendWhatsAppMessage, sendWhatsAppTemplate } from "~/lib/whatsapp-cloud-api";
import { buildTemplateParams } from "~/lib/whatsapp-template-vars";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const DELIVERY_STATUS_LABEL: Record<Inquiry["deliveryStatus"], string> = {
  cancelled: "cancelled",
  confirmed: "confirmed",
  delivered: "delivered",
  out_for_delivery: "out for delivery",
  pending_review: "pending review",
  placed: "placed",
  processing: "in processing",
  refunded: "refunded",
  shipped: "shipped",
};

/** Sent on delivery-status transitions the admin sets in /admin/inquiries. */
export async function notifyCustomerOfDeliveryChange(inquiry: Inquiry): Promise<void> {
  const status = inquiry.deliveryStatus;
  const [templates, bodies] = await Promise.all([
    getWhatsAppTemplateNames(),
    getWhatsAppTemplateBodies(),
  ]);
  const values = inquiryVariableValues(inquiry, { status: DELIVERY_STATUS_LABEL[status] });

  if (status === "shipped") {
    await sendTemplateAndLog(inquiry, templates.orderShipped, bodies.orderShipped, values);
    return;
  }

  if (status === "cancelled" || status === "refunded") {
    await sendTemplateAndLog(
      inquiry,
      templates.orderCancelledRefunded,
      bodies.orderCancelledRefunded,
      values,
    );
    return;
  }

  await sendTemplateAndLog(inquiry, templates.orderStatusUpdate, bodies.orderStatusUpdate, values);
}

/** Sent on approve/reject — mirrors the existing email notification. */
export async function notifyCustomerOfStatusChange(inquiry: Inquiry): Promise<void> {
  const [templates, bodies] = await Promise.all([
    getWhatsAppTemplateNames(),
    getWhatsAppTemplateBodies(),
  ]);
  const label = inquiry.status === "approved" ? "approved" : "declined";
  const values = inquiryVariableValues(inquiry, { status: label });
  await sendTemplateAndLog(inquiry, templates.orderStatusUpdate, bodies.orderStatusUpdate, values);
}

/** Sent once, right after checkout/inquiry creation, to the customer. */
export async function notifyCustomerOrderConfirmed(inquiry: Inquiry): Promise<void> {
  const [templates, bodies] = await Promise.all([
    getWhatsAppTemplateNames(),
    getWhatsAppTemplateBodies(),
  ]);
  const values = inquiryVariableValues(inquiry);
  await sendTemplateAndLog(inquiry, templates.orderConfirmed, bodies.orderConfirmed, values);
}

/**
 * Free-form reply from the admin panel — valid only within Meta's 24h
 * window after the customer's last inbound message, same rule that lets a
 * human reply from the WhatsApp app itself.
 */
export async function sendAdminReply(
  inquiry: Inquiry,
  toPhone: string,
  body: string,
): Promise<{ error: string; success: false } | { success: true }> {
  const credentials = await getWhatsAppCredentials();
  const result = await sendWhatsAppMessage(toPhone, body, credentials);
  await logOutbound(inquiry.id, toPhone, result, body);
  if (!result.success) return { error: result.error, success: false };
  return { success: true };
}

function customerPhone(inquiry: Inquiry): null | string {
  const digits = inquiry.customerContact.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

/** Computes the values available to {{tokens}} in a template body for a given inquiry. */
function inquiryVariableValues(
  inquiry: Inquiry,
  overrides: Partial<Record<string, string>> = {},
): Record<string, string> {
  const [firstName, ...rest] = inquiry.customerName.trim().split(/\s+/);
  return {
    first_name: firstName || inquiry.customerName,
    full_name: inquiry.customerName,
    last_name: rest.join(" "),
    order_number: formatOrderNumber(inquiry.orderNumber),
    status: "",
    total: CURRENCY_FORMATTER.format(inquiry.subtotal),
    tracking_url: inquiry.trackingUrl || "will be shared shortly",
    ...overrides,
  };
}

async function logOutbound(
  inquiryId: string,
  toPhone: string,
  result: Awaited<ReturnType<typeof sendWhatsAppMessage>>,
  body: string,
): Promise<void> {
  try {
    await db.insert(whatsappMessageTable).values({
      body,
      direction: "outbound",
      fromPhone: "system",
      id: createId(),
      inquiryId,
      status: result.success ? "matched" : "ignored",
      toPhone,
      waMessageId: result.success ? result.waMessageId : `failed-${createId()}`,
    });
  } catch (error) {
    console.error("Failed to log outbound WhatsApp message:", error);
  }
}

async function sendTemplateAndLog(
  inquiry: Inquiry,
  templateName: string,
  templateBody: string,
  values: Record<string, string>,
): Promise<void> {
  const to = customerPhone(inquiry);
  if (!to) return;

  const params = buildTemplateParams(templateBody, values);
  const credentials = await getWhatsAppCredentials();
  const result = await sendWhatsAppTemplate(to, templateName, params, credentials);
  await logOutbound(inquiry.id, to, result, `[${templateName}] ${params.join(" | ")}`);
}
