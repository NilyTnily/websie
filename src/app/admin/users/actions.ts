"use server";

import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { db } from "~/db";
import { accountTable, sessionTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  await requireAdmin();

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters.", success: false as const };
  }
  if (newPassword.length > 128) {
    return { error: "Password too long.", success: false as const };
  }

  try {
    const account = await db.query.accountTable.findFirst({
      where: eq(accountTable.userId, userId),
    });
    if (!account) {
      return { error: "No credential account found for this user (maybe OAuth only).", success: false as const };
    }

    const hashed = await hashPassword(newPassword);
    await db.update(accountTable).set({ password: hashed }).where(eq(accountTable.userId, userId));
    // revoke all sessions so user must re-login with new password
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId));

    return { success: true as const };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return { error: "Could not reset password.", success: false as const };
  }
}

export async function deleteUserAction(userId: string) {
  await requireAdmin();
  try {
    // better-auth cascade will delete account/session via FK, but ensure user row removed
    const { userTable } = await import("~/db/schema");
    const { eq: eq2 } = await import("drizzle-orm");
    await db.delete(userTable).where(eq2(userTable.id, userId));
    return { success: true as const };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { error: "Could not delete user.", success: false as const };
  }
}
