import "server-only";

import { getCurrentUser } from "~/lib/auth";

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export function isAdminEmail(email: null | string | undefined): boolean {
  if (!email) return false;
  return adminEmails.has(email.toLowerCase());
}

/**
 * Re-verifies admin access at the mutation boundary. The /admin layout already
 * gates page rendering, but server actions are independently reachable network
 * endpoints, so every catalog mutation calls this before touching the database.
 */
export async function requireAdmin(): Promise<void> {
  const user = await getCurrentUser();
  if (!isAdminEmail(user?.email)) {
    throw new Error("Admin access required");
  }
}
