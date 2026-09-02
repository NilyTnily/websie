import "server-only";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { userTable } from "~/db/schema";
import { getCurrentUser } from "~/lib/auth";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return raw.trim();
}

export async function updateCurrentUserPhone(
  rawPhone: string,
): Promise<{ error?: string; success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in.", success: false };

  const trimmed = rawPhone.trim();
  // allow clearing
  if (trimmed === "") {
    await db.update(userTable).set({ phone: null, updatedAt: new Date() }).where(eq(userTable.id, user.id));
    return { success: true };
  }

  const normalized = normalizePhone(trimmed);
  if (!normalized) {
    return { error: "Please enter a valid phone (7-15 digits).", success: false };
  }

  // store as entered (keep + / spaces for display) but validation uses digits
  await db.update(userTable).set({ phone: trimmed, updatedAt: new Date() }).where(eq(userTable.id, user.id));
  return { success: true };
}

export async function ensureUserPhoneFromContact(
  userId: string | undefined,
  customerContact: string,
): Promise<void> {
  if (!userId) return;
  const normalized = normalizePhone(customerContact);
  if (!normalized) return; // email-only
  try {
    const existing = await db.query.userTable.findFirst({
      columns: { phone: true },
      where: eq(userTable.id, userId),
    });
    if (existing && existing.phone) return; // already has phone
    await db.update(userTable).set({ phone: customerContact.trim(), updatedAt: new Date() }).where(eq(userTable.id, userId));
  } catch (e) {
    console.error("Failed to auto-save phone from checkout:", e);
  }
}
