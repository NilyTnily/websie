"use server";

import { createNewsletterSignup } from "~/lib/queries/newsletter";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NewsletterFormState {
  error?: string;
  success?: boolean;
}

export async function newsletterSignupAction(
  _prevState: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const ip = await getClientIp();
  const allowed = await checkRateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!allowed) {
    return { error: "Too many requests — please wait a minute and try again." };
  }

  const result = await createNewsletterSignup(email);
  if (!result.success) return { error: result.error };

  return { success: true };
}
