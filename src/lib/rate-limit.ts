import "server-only";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "~/db";
import { actionRateLimitTable } from "~/db/schema";

/**
 * Fixed-window rate limit for Server Actions (not covered by better-auth's
 * own rate limiter, which only sees its own /api/auth/* HTTP routes).
 * Returns true if the request is allowed, false if it should be rejected.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const now = new Date();
  const existing = await db.query.actionRateLimitTable.findFirst({
    where: eq(actionRateLimitTable.key, key),
  });

  if (!existing || now.getTime() - existing.windowStart.getTime() > windowMs) {
    await db
      .insert(actionRateLimitTable)
      .values({ count: 1, id: createId(), key, windowStart: now })
      .onConflictDoUpdate({
        set: { count: 1, windowStart: now },
        target: actionRateLimitTable.key,
      });
    return true;
  }

  if (existing.count >= max) {
    return false;
  }

  await db
    .update(actionRateLimitTable)
    .set({ count: existing.count + 1 })
    .where(eq(actionRateLimitTable.key, key));
  return true;
}

/** Best-effort client IP for rate-limit keying — falls back to a shared bucket if unavailable (e.g. local dev without a proxy). */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headerList.get("x-real-ip") ?? "unknown";
}
