import "server-only";
import { Resend } from "resend";

import { SEO_CONFIG } from "~/app";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface SendEmailInput {
  html: string;
  subject: string;
  to: string;
}

/** No-ops with a console warning when RESEND_API_KEY isn't configured, so email-dependent flows degrade gracefully instead of crashing. */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!resend) {
    console.warn(
      `RESEND_API_KEY not configured — skipped sending "${input.subject}" to ${input.to}`,
    );
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const { error } = await resend.emails.send({
    from: `${SEO_CONFIG.name} <${from}>`,
    html: input.html,
    subject: input.subject,
    to: input.to,
  });

  if (error) {
    console.error(
      `Failed to send email "${input.subject}" to ${input.to}:`,
      error,
    );
  }
}
