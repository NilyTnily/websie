"use server";

import { createStockNotification } from "~/lib/queries/stock-notifications";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NotifyMeFormState {
  error?: string;
  success?: boolean;
}

export async function notifyMeAction(
  productId: string,
  _prevState: NotifyMeFormState,
  formData: FormData,
): Promise<NotifyMeFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const ip = await getClientIp();
  const allowed = await checkRateLimit(`notify:${ip}`, 5, 60_000);
  if (!allowed) {
    return { error: "Too many requests — please wait a minute and try again." };
  }

  const result = await createStockNotification(productId, email);
  if (!result.success) return { error: result.error };

  return { success: true };
}
