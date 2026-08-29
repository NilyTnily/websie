import { NextResponse } from "next/server";

import { getWhatsAppCredentials } from "~/lib/queries/integrations";
import { ingestInboundMessage } from "~/lib/queries/whatsapp-messages";
import { checkRateLimit } from "~/lib/rate-limit";
import {
  parseWebhookPayload,
  verifyWebhookSignature,
} from "~/lib/whatsapp-cloud-api";

const WEBHOOK_RATE_LIMIT_MAX = 30;
const WEBHOOK_RATE_LIMIT_WINDOW_MS = 5 * 60_000;

/** Meta's one-time webhook verification handshake, run when registering the callback URL. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const { verifyToken } = await getWhatsAppCredentials();
  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  // Signature must be verified against the raw body — parsing to JSON
  // first and re-stringifying would not reproduce the same bytes.
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const { appSecret, phoneNumberId } = await getWhatsAppCredentials();

  if (
    !appSecret ||
    !verifyWebhookSignature(rawBody, signature, appSecret)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as unknown;
    const messages = parseWebhookPayload(payload);

    for (const message of messages) {
      // Defense-in-depth backstop against a compromised/spoofed sender
      // hammering the endpoint after passing signature check — the
      // signature is the real gate, this is just an abuse guard.
      const allowed = await checkRateLimit(
        `whatsapp-webhook:${message.from}`,
        WEBHOOK_RATE_LIMIT_MAX,
        WEBHOOK_RATE_LIMIT_WINDOW_MS,
      );
      if (!allowed) continue;

      try {
        await ingestInboundMessage({
          body: message.body,
          fromPhone: message.from,
          rawPayload: message.raw,
          toPhone: phoneNumberId ?? "",
          waMessageId: message.waMessageId,
        });
      } catch (error) {
        // One bad message shouldn't fail the whole batch — Meta retries
        // the entire POST on a non-2xx response, so log and keep going.
        console.error("Failed to ingest WhatsApp message:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to process WhatsApp webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
