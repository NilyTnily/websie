import "server-only";
import { and, desc, eq } from "drizzle-orm";

import type { StockNotification } from "~/db/schema";

import { db } from "~/db";
import { stockNotificationTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";
import { sendEmail } from "~/lib/email";

export interface StockNotificationWithProduct extends StockNotification {
  product: { image: string; name: string };
}

const MutationResult = {
  err: (error: string) => ({ error, success: false as const }),
  ok: <T = undefined>(data?: T) => ({ data, success: true as const }),
};

/** Insert-or-ignore on the (productId, email) unique index — a repeat signup is a silent success, not an error. */
export async function createStockNotification(
  productId: string,
  email: string,
): Promise<{ error: string; success: false } | { success: true }> {
  try {
    await db
      .insert(stockNotificationTable)
      .values({ email, id: crypto.randomUUID(), productId })
      .onConflictDoNothing();
    return MutationResult.ok();
  } catch (error) {
    console.error("Failed to create stock notification:", error);
    return MutationResult.err("Could not save your request.");
  }
}

export async function getAllStockNotificationsForAdmin(): Promise<
  StockNotificationWithProduct[]
> {
  await requireAdmin();
  try {
    return await db.query.stockNotificationTable.findMany({
      orderBy: [desc(stockNotificationTable.createdAt)],
      with: { product: { columns: { image: true, name: true } } },
    });
  } catch (error) {
    console.error("Failed to fetch stock notifications:", error);
    return [];
  }
}

/** Emails every un-notified subscriber for a product and marks them notified — called from updateProduct when a product flips back in stock. */
export async function notifyPendingSubscribers(
  productId: string,
): Promise<void> {
  try {
    const pending = await db.query.stockNotificationTable.findMany({
      where: and(
        eq(stockNotificationTable.productId, productId),
        eq(stockNotificationTable.notified, false),
      ),
      with: { product: { columns: { name: true } } },
    });
    if (pending.length === 0) return;

    await Promise.all(
      pending.map((subscriber) =>
        sendEmail({
          html: `<p>Good news — the <strong>${subscriber.product.name}</strong> you asked about is back in stock.</p>`,
          subject: `${subscriber.product.name} is back in stock`,
          to: subscriber.email,
        }),
      ),
    );

    await db
      .update(stockNotificationTable)
      .set({ notified: true })
      .where(
        and(
          eq(stockNotificationTable.productId, productId),
          eq(stockNotificationTable.notified, false),
        ),
      );
  } catch (error) {
    console.error("Failed to notify pending stock subscribers:", error);
  }
}
