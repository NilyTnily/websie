import "server-only";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import type { Inquiry, InquiryDeliveryAddress, InquiryItem } from "~/db/schema";

import {
  isPendingDeliveryStatus,
  MAX_PENDING_ORDERS,
  PENDING_DELIVERY_STATUSES,
} from "~/lib/delivery-status";

import { db } from "~/db";
import { inquiryTable, userTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";
import { sendEmail } from "~/lib/email";
import { formatOrderNumber } from "~/lib/order-number";
import { createNotification, notifyAdmins } from "~/lib/queries/notifications";
import {
  notifyCustomerOfDeliveryChange,
  notifyCustomerOfStatusChange as notifyCustomerOfStatusChangeWhatsApp,
  notifyCustomerOrderConfirmed,
} from "~/lib/queries/whatsapp-notify";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

export interface CreateInquiryInput {
  customerContact: string;
  customerName: string;
  deliveryAddress?: InquiryDeliveryAddress;
  deliveryCost?: number;
  deliveryMethod?: Inquiry["deliveryMethod"];
  engravingText?: string;
  items: InquiryItem[];
  note?: string;
  presentationCost?: number;
  presentationOption?: Inquiry["presentationOption"];
  userId?: string;
}

export interface DeliveredPiece extends InquiryItem {
  acquiredAt: Date;
  inquiryId: string;
}

export interface InquiryStats {
  approved: number;
  pending: number;
  rejected: number;
  total: number;
  totalValue: number;
}

export interface UpdateDeliveryInput {
  deliveryStatus: Inquiry["deliveryStatus"];
}

export async function countPendingInquiriesForUser(
  userId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(inquiryTable)
    .where(
      and(
        eq(inquiryTable.userId, userId),
        inArray(inquiryTable.deliveryStatus, PENDING_DELIVERY_STATUSES),
      ),
    );
  return row?.count ?? 0;
}

export async function cancelInquiryForUser(
  inquiryId: string,
  userId: string,
): Promise<{ error: string; success: false } | { success: true }> {
  const existing = await db.query.inquiryTable.findFirst({
    where: and(
      eq(inquiryTable.id, inquiryId),
      eq(inquiryTable.userId, userId),
    ),
  });
  if (!existing) {
    return { error: "Order not found.", success: false };
  }
  if (!isPendingDeliveryStatus(existing.deliveryStatus)) {
    return {
      error: "Only pending orders can be cancelled.",
      success: false,
    };
  }
  await db
    .update(inquiryTable)
    .set({ deliveryStatus: "cancelled", updatedAt: new Date() })
    .where(eq(inquiryTable.id, inquiryId));

  // Refresh order for notifications
  const [updated] = await db
    .select()
    .from(inquiryTable)
    .where(eq(inquiryTable.id, inquiryId));
  if (updated) {
    await notifyCustomerOfDeliveryChange(updated as Inquiry);
  }

  return { success: true };
}

export async function createInquiry(
  input: CreateInquiryInput,
): Promise<Inquiry> {
  // Enforce per-user pending limit (applies only to authenticated users).
  if (input.userId) {
    const pendingCount = await countPendingInquiriesForUser(input.userId);
    if (pendingCount >= MAX_PENDING_ORDERS) {
      throw new Error(
        `You already have ${MAX_PENDING_ORDERS} pending orders. Cancel a pending order or wait for processing before placing a new one.`,
      );
    }
  }

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const [inquiry] = await db
    .insert(inquiryTable)
    .values({
      customerContact: input.customerContact,
      customerName: input.customerName,
      deliveryAddress: input.deliveryAddress,
      deliveryCost: input.deliveryCost,
      deliveryMethod: input.deliveryMethod,
      engravingText: input.engravingText || null,
      id: createId(),
      items: input.items,
      note: input.note || null,
      presentationCost: input.presentationCost,
      presentationOption: input.presentationOption,
      subtotal,
      userId: input.userId,
    })
    .returning();
  if (!inquiry) throw new Error("Failed to create inquiry");

  const orderNumber = formatOrderNumber(inquiry.orderNumber);
  const itemCount = input.items.length;
  const link = `/admin/inquiries/${inquiry.id}`;

  await notifyAdmins({
    description: `${input.customerName} requested ${itemCount} item${itemCount === 1 ? "" : "s"} — ${CURRENCY_FORMATTER.format(subtotal)}`,
    link,
    title: `New inquiry ${orderNumber}`,
    type: "info",
  });

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  await Promise.all(
    adminEmails.map((email) =>
      sendEmail({
        html: `<p><strong>${input.customerName}</strong> submitted inquiry ${orderNumber} for ${itemCount} item(s), totaling ${CURRENCY_FORMATTER.format(subtotal)}.</p><p>Contact: ${input.customerContact}</p>`,
        subject: `New inquiry ${orderNumber} — ${CURRENCY_FORMATTER.format(subtotal)}`,
        to: email,
      }),
    ),
  );

  if (EMAIL_PATTERN.test(input.customerContact)) {
    await sendEmail({
      html: `<p>Hi ${input.customerName},</p><p>We've received your inquiry ${orderNumber} for ${itemCount} item(s), totaling ${CURRENCY_FORMATTER.format(subtotal)}. Our team will be in touch shortly.</p>`,
      subject: `We received your inquiry ${orderNumber}`,
      to: input.customerContact,
    });
  }

  // Best-effort — a WhatsApp send failure (e.g. template not yet approved,
  // credentials unset) must never block inquiry creation. Errors are
  // logged inside whatsapp-notify and surfaced via the outbound message
  // log, not thrown here.
  await notifyCustomerOrderConfirmed(inquiry);

  return inquiry;
}

/** Flattens every item across a user's delivered inquiries into "pieces they own" — the Vault's "My pieces" tab. Jsonb array elements aren't cheaply joinable in SQL here, and per-user inquiry counts are small, so flattening in application code is the simplest correct approach. */
export async function getDeliveredItemsForUser(
  userId: string,
): Promise<DeliveredPiece[]> {
  try {
    const delivered = await db.query.inquiryTable.findMany({
      orderBy: [desc(inquiryTable.updatedAt)],
      where: and(
        eq(inquiryTable.userId, userId),
        eq(inquiryTable.deliveryStatus, "delivered"),
      ),
    });
    return delivered.flatMap((inquiry) =>
      inquiry.items.map((item) => ({
        ...item,
        acquiredAt: inquiry.updatedAt,
        inquiryId: inquiry.id,
      })),
    );
  } catch (error) {
    console.error("Failed to fetch delivered items:", error);
    return [];
  }
}

export async function getInquiries(): Promise<Inquiry[]> {
  try {
    await requireAdmin();
    return await db.query.inquiryTable.findMany({
      orderBy: [desc(inquiryTable.createdAt)],
    });
  } catch (error) {
    console.error("Failed to fetch inquiries:", error);
    return [];
  }
}

/** For the signed-in customer's own order history — no admin check, but scoped to their userId. */
export async function getInquiriesForUser(userId: string): Promise<Inquiry[]> {
  try {
    return await db.query.inquiryTable.findMany({
      orderBy: [desc(inquiryTable.createdAt)],
      where: eq(inquiryTable.userId, userId),
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return [];
  }
}

export async function getInquiryById(id: string): Promise<Inquiry | null> {
  try {
    await requireAdmin();
    return (
      (await db.query.inquiryTable.findFirst({
        where: eq(inquiryTable.id, id),
      })) ?? null
    );
  } catch (error) {
    console.error("Failed to fetch inquiry:", error);
    return null;
  }
}

/** Ownership-checked lookup so a customer can't view another customer's order by guessing an id. */
export async function getInquiryByIdForUser(
  id: string,
  userId: string,
): Promise<Inquiry | null> {
  try {
    return (
      (await db.query.inquiryTable.findFirst({
        where: and(eq(inquiryTable.id, id), eq(inquiryTable.userId, userId)),
      })) ?? null
    );
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return null;
  }
}

export async function getInquiryStats(): Promise<InquiryStats> {
  try {
    await requireAdmin();
    const rows = await db
      .select({
        count: sql<number>`count(*)::int`,
        status: inquiryTable.status,
        value: sql<number>`coalesce(sum(${inquiryTable.subtotal}), 0)::int`,
      })
      .from(inquiryTable)
      .groupBy(inquiryTable.status);

    const stats: InquiryStats = {
      approved: 0,
      pending: 0,
      rejected: 0,
      total: 0,
      totalValue: 0,
    };
    for (const row of rows) {
      stats[row.status] = row.count;
      stats.total += row.count;
      stats.totalValue += row.value;
    }
    return stats;
  } catch (error) {
    console.error("Failed to fetch inquiry stats:", error);
    return { approved: 0, pending: 0, rejected: 0, total: 0, totalValue: 0 };
  }
}

export async function updateInquiryDelivery(
  id: string,
  input: UpdateDeliveryInput,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    const [inquiry] = await db
      .update(inquiryTable)
      .set({
        deliveryStatus: input.deliveryStatus,
        updatedAt: new Date(),
      })
      .where(eq(inquiryTable.id, id))
      .returning();

    if (inquiry) await notifyCustomerOfDeliveryChange(inquiry);

    return { success: true };
  } catch (error) {
    console.error("Failed to update delivery info:", error);
    return { error: "Could not update delivery info.", success: false };
  }
}

export async function updateInquiryStatus(
  id: string,
  status: Inquiry["status"],
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    const [inquiry] = await db
      .update(inquiryTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(inquiryTable.id, id))
      .returning();

    if (inquiry && (status === "approved" || status === "rejected")) {
      await notifyCustomerOfStatusChange(inquiry);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update inquiry status:", error);
    return { error: "Could not update the inquiry.", success: false };
  }
}

async function notifyCustomerOfStatusChange(inquiry: Inquiry): Promise<void> {
  const orderNumber = formatOrderNumber(inquiry.orderNumber);
  const approved = inquiry.status === "approved";
  const title = approved
    ? `Inquiry ${orderNumber} approved`
    : `Inquiry ${orderNumber} declined`;
  const description = approved
    ? "Your inquiry has been approved — we'll be in touch about next steps."
    : "Your inquiry couldn't be approved. Reach out if you have questions.";
  const link = `/dashboard/orders/${inquiry.id}`;

  if (inquiry.userId) {
    await createNotification({
      description,
      link,
      title,
      type: approved ? "success" : "warning",
      userId: inquiry.userId,
    });
  }

  const email = EMAIL_PATTERN.test(inquiry.customerContact)
    ? inquiry.customerContact
    : inquiry.userId
      ? (
          await db.query.userTable.findFirst({
            columns: { email: true },
            where: eq(userTable.id, inquiry.userId),
          })
        )?.email
      : undefined;

  if (email) {
    await sendEmail({
      html: `<p>${description}</p>`,
      subject: title,
      to: email,
    });
  }

  await notifyCustomerOfStatusChangeWhatsApp(inquiry);
}
