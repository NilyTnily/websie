import "server-only";
import axios from "axios";
import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH_API_VERSION = "v20.0";

export interface ParsedInboundMessage {
  body: string;
  from: string;
  raw: unknown;
  timestampMs: number;
  waMessageId: string;
}

export type SendWhatsAppMessageResult =
  | { error: string; success: false }
  | { success: true; waMessageId: string };

interface MetaWebhookPayload {
  entry?: {
    changes?: {
      value?: {
        messages?: {
          from: string;
          id: string;
          text?: { body: string };
          timestamp: string;
          type: string;
        }[];
      };
    }[];
  }[];
}

/**
 * Flattens Meta's nested webhook payload into a normalized message list.
 * Meta also POSTs "statuses" events (delivery receipts for our own
 * outbound sends) to the same webhook URL — those carry no `messages`
 * array and are silently skipped here, not new inbound messages.
 */
export function parseWebhookPayload(
  payload: unknown,
): ParsedInboundMessage[] {
  const body = payload as MetaWebhookPayload;
  const results: ParsedInboundMessage[] = [];

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        // Only plain text is parsed for matching/extraction today; other
        // types (image, document, etc) are still logged with a placeholder
        // body so they show up in the admin inbox for manual handling.
        const text = message.text?.body ?? `[unsupported message type: ${message.type}]`;
        results.push({
          body: text,
          from: message.from,
          raw: message,
          timestampMs: Number.parseInt(message.timestamp, 10) * 1000,
          waMessageId: message.id,
        });
      }
    }
  }

  return results;
}

/**
 * Sends a text message via the WhatsApp Cloud API Graph endpoint. Not
 * wired into any UI yet — anticipates outbound notification/logging work
 * building on the same `whatsapp_message` table (direction: "outbound").
 * Credentials are passed in rather than read from env directly, since an
 * admin can override them via /admin/settings — see
 * ~/lib/queries/integrations#getWhatsAppCredentials.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string,
  credentials: { accessToken: null | string; phoneNumberId: null | string },
): Promise<SendWhatsAppMessageResult> {
  const { accessToken, phoneNumberId } = credentials;
  if (!phoneNumberId || !accessToken) {
    return { error: "WhatsApp Cloud API is not configured.", success: false };
  }

  try {
    const response = await axios.post<{ messages?: { id: string }[] }>(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        text: { body },
        to,
        type: "text",
      },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const waMessageId = response.data.messages?.[0]?.id;
    if (!waMessageId) {
      return { error: "WhatsApp API returned no message id.", success: false };
    }
    return { success: true, waMessageId };
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return { error: "Failed to send WhatsApp message.", success: false };
  }
}

/**
 * Verifies Meta's `X-Hub-Signature-256` header against the raw request
 * body. Must run against the raw (unparsed) bytes — parsing to JSON first
 * and re-stringifying will not reproduce the same signature.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: null | string,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");
  if (expectedBuffer.length !== providedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
