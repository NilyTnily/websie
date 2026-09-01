import "server-only";
import { createId } from "@paralleldrive/cuid2";
import { desc, eq } from "drizzle-orm";

import type { Inquiry, WhatsappMessage } from "~/db/schema";

import { db } from "~/db";
import { inquiryTable, whatsappMessageTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";
import {
  extractOrderNumber,
  extractTrackingCandidate,
  matchByPhone,
} from "~/lib/whatsapp-matching";

import { createShipment, type ShipmentInput } from "./shipments";

export interface IngestResult {
  matched: boolean;
  message: WhatsappMessage;
}

export interface WhatsAppMessageFilters {
  matchMethod?: WhatsappMessage["matchMethod"];
  status?: WhatsappMessage["status"];
}

export async function applyMessageAsShipment(
  messageId: string,
  inquiryId: string,
  input: ShipmentInput,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    const result = await createShipment(inquiryId, input);
    if (!result.success) return result;

    await db
      .update(whatsappMessageTable)
      .set({
        appliedShipmentId: result.shipment.id,
        status: "applied",
        updatedAt: new Date(),
      })
      .where(eq(whatsappMessageTable.id, messageId));

    return { success: true };
  } catch (error) {
    console.error("Failed to apply message as shipment:", error);
    return { error: "Failed to apply message as shipment.", success: false };
  }
}

export async function getWhatsAppMessages(
  filters: WhatsAppMessageFilters = {},
): Promise<WhatsappMessage[]> {
  try {
    await requireAdmin();
    return await db.query.whatsappMessageTable.findMany({
      orderBy: (messages, { desc: byDesc }) => [byDesc(messages.receivedAt)],
      where: (messages, { and, eq: isEq }) => {
        const clauses = [];
        if (filters.status) clauses.push(isEq(messages.status, filters.status));
        if (filters.matchMethod) {
          clauses.push(isEq(messages.matchMethod, filters.matchMethod));
        }
        return clauses.length ? and(...clauses) : undefined;
      },
    });
  } catch (error) {
    console.error("Failed to fetch WhatsApp messages:", error);
    return [];
  }
}

export async function getWhatsAppMessagesForInquiry(
  inquiryId: string,
): Promise<WhatsappMessage[]> {
  try {
    await requireAdmin();
    return await db.query.whatsappMessageTable.findMany({
      orderBy: (messages, { desc: byDesc }) => [byDesc(messages.receivedAt)],
      where: eq(whatsappMessageTable.inquiryId, inquiryId),
    });
  } catch (error) {
    console.error("Failed to fetch WhatsApp messages for order:", error);
    return [];
  }
}

/**
 * The webhook entry point: records one inbound message, running order
 * number / phone matching and best-effort tracking extraction along the
 * way. Not gated by requireAdmin — see findInquiryByPhone above for why.
 * Idempotent on `waMessageId` (Meta retries webhook deliveries).
 */
export async function ingestInboundMessage(input: {
  body: string;
  fromPhone: string;
  rawPayload: unknown;
  toPhone: string;
  waMessageId: string;
}): Promise<IngestResult | null> {
  const existing = await db.query.whatsappMessageTable.findFirst({
    where: eq(whatsappMessageTable.waMessageId, input.waMessageId),
  });
  if (existing) return null;

  const orderNumber = extractOrderNumber(input.body);
  const tracking = extractTrackingCandidate(input.body);

  let inquiry: Inquiry | null = null;
  let matchMethod: WhatsappMessage["matchMethod"] = "unmatched";

  if (orderNumber !== null) {
    inquiry =
      (await db.query.inquiryTable.findFirst({
        where: eq(inquiryTable.orderNumber, orderNumber),
      })) ?? null;
    if (inquiry) matchMethod = "order_number";
  }

  if (!inquiry) {
    inquiry = await findInquiryByPhone(input.fromPhone);
    if (inquiry) matchMethod = "phone";
  }

  const [message] = await db
    .insert(whatsappMessageTable)
    .values({
      body: input.body,
      direction: "inbound",
      extractedCarrier: tracking.carrier,
      extractedOrderNumber: orderNumber,
      extractedTrackingNumber: tracking.trackingNumber,
      fromPhone: input.fromPhone,
      id: createId(),
      inquiryId: inquiry?.id ?? null,
      matchMethod,
      rawPayload: input.rawPayload,
      status: inquiry ? "matched" : "received",
      toPhone: input.toPhone,
      waMessageId: input.waMessageId,
    })
    .returning();
  if (!message) return null;

  return { matched: inquiry !== null, message };
}

export async function markMessageIgnored(
  messageId: string,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    await db
      .update(whatsappMessageTable)
      .set({ status: "ignored", updatedAt: new Date() })
      .where(eq(whatsappMessageTable.id, messageId));
    return { success: true };
  } catch (error) {
    console.error("Failed to ignore message:", error);
    return { error: "Failed to ignore message.", success: false };
  }
}

export async function matchMessageToInquiry(
  messageId: string,
  inquiryId: string,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    await db
      .update(whatsappMessageTable)
      .set({
        inquiryId,
        matchMethod: "manual",
        status: "matched",
        updatedAt: new Date(),
      })
      .where(eq(whatsappMessageTable.id, messageId));
    return { success: true };
  } catch (error) {
    console.error("Failed to match message to order:", error);
    return { error: "Failed to match message to order.", success: false };
  }
}

/**
 * Looked up by phone digits, not gated by requireAdmin — called from the
 * webhook route, which authenticates via Meta's HMAC signature rather than
 * a user session. Small table for a single storefront, so scanning all
 * inquiries in memory is simpler and fast enough; revisit with an indexed
 * normalized-phone column if this table grows large.
 */
async function findInquiryByPhone(fromPhone: string): Promise<Inquiry | null> {
  const candidates = await db.query.inquiryTable.findMany({
    orderBy: [desc(inquiryTable.createdAt)],
  });
  return (
    candidates.find((inquiry) =>
      matchByPhone(fromPhone, inquiry.customerContact),
    ) ?? null
  );
}
