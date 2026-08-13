import type { actionRateLimitTable } from "./tables";

export type ActionRateLimit = typeof actionRateLimitTable.$inferSelect;
