import "server-only";

import { db } from "~/db";
import { newsletterSignupTable } from "~/db/schema";

const MutationResult = {
  err: (error: string) => ({ error, success: false as const }),
  ok: <T = undefined>(data?: T) => ({ data, success: true as const }),
};

/** Insert-or-ignore on the unique email — a repeat signup is a silent success, not an error. */
export async function createNewsletterSignup(
  email: string,
): Promise<{ error: string; success: false } | { success: true }> {
  try {
    await db
      .insert(newsletterSignupTable)
      .values({ email, id: crypto.randomUUID() })
      .onConflictDoNothing();
    return MutationResult.ok();
  } catch (error) {
    console.error("Failed to create newsletter signup:", error);
    return MutationResult.err("Could not save your request.");
  }
}
