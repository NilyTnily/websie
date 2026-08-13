import "server-only";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, sql } from "drizzle-orm";

import type { Inquiry, InquiryItem } from "~/db/schema";

import { db } from "~/db";
import { inquiryTable, userTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";
import { sendEmail } from "~/lib/email";
import { formatOrderNumber } from "~/lib/order-number";
import { createNotification, notifyAdmins } from "~/lib/queries/notifications";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

export interface CreateInquiryInput {
  customerContact: string;
  customerName: string;
  items: InquiryItem[];
  note?: string;
  userId?: string;
}

export interface InquiryStats {
  approved: number;
  pending: number;
  rejected: number;
  total: number;
  totalValue: number;
}

export interface UpdateDeliveryInput {
  carrier?: string;
  deliveryStatus: Inquiry["deliveryStatus"];
  trackingUrl?: string;
}

export async function createInquiry(
  input: CreateInquiryInput,
): Promise<Inquiry> {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const [inquiry] = await db
    .insert(inquiryTable)
    .values({
      customerContact: input.customerContact,
      customerName: input.customerName,
      id: createId(),
      items: input.items,
      note: input.note || null,
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

  return inquiry;
}

export async function getInquiries(): Promise<Inquiry[]> {
  await requireAdmin();
  try {
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
  await requireAdmin();
  try {
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
  await requireAdmin();
  try {
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
    await db
      .update(inquiryTable)
      .set({
        carrier: input.carrier || null,
        deliveryStatus: input.deliveryStatus,
        trackingUrl: input.trackingUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(inquiryTable.id, id));
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
}
