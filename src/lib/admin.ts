import "server-only";

import { getCurrentUser } from "~/lib/auth";
import { isAdminEmail } from "~/lib/is-admin";

export { isAdminEmail } from "~/lib/is-admin";

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
