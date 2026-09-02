import "server-only";
import { eq } from "drizzle-orm";

import type { IntegrationSettings } from "~/db/schema";

import { db } from "~/db";
import { integrationSettingsTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";
import {
  DEFAULT_TEMPLATE_BODIES,
  type WhatsAppTemplateBodies,
} from "~/lib/whatsapp-template-vars";

export interface GoogleOAuthCredentials {
  clientId: null | string;
  clientSecret: null | string;
}

export interface UpdateIntegrationSettingsInput {
  googleClientId: null | string;
  googleClientSecret: null | string;
  whatsappAccessToken: null | string;
  whatsappAppSecret: null | string;
  whatsappPhoneNumberId: null | string;
  whatsappTemplateNewArrivals: null | string;
  whatsappTemplateNewArrivalsBody: null | string;
  whatsappTemplateOrderCancelledRefunded: null | string;
  whatsappTemplateOrderCancelledRefundedBody: null | string;
  whatsappTemplateOrderConfirmed: null | string;
  whatsappTemplateOrderConfirmedBody: null | string;
  whatsappTemplateOrderShipped: null | string;
  whatsappTemplateOrderShippedBody: null | string;
  whatsappTemplateOrderStatusUpdate: null | string;
  whatsappTemplateOrderStatusUpdateBody: null | string;
  whatsappVerifyToken: null | string;
}

export interface WhatsAppCredentials {
  accessToken: null | string;
  appSecret: null | string;
  phoneNumberId: null | string;
  verifyToken: null | string;
}

export interface WhatsAppTemplateNames {
  newArrivals: string;
  orderCancelledRefunded: string;
  orderConfirmed: string;
  orderShipped: string;
  orderStatusUpdate: string;
}

/**
 * Not gated by requireAdmin — see getWhatsAppCredentials above for why.
 * DB value wins when set, otherwise falls back to the matching env var.
 */
export async function getGoogleOAuthCredentials(): Promise<GoogleOAuthCredentials> {
  const row = await fetchIntegrationSettings();
  return {
    clientId: row?.googleClientId || process.env.GOOGLE_CLIENT_ID || null,
    clientSecret:
      row?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || null,
  };
}

/** Admin-only read for the settings form — masked/full values shown only to the signed-in admin. */
export async function getIntegrationSettings(): Promise<IntegrationSettings | null> {
  try {
    await requireAdmin();
    return await fetchIntegrationSettings();
  } catch (error) {
    console.error("Failed to fetch integration settings:", error);
    return null;
  }
}

/**
 * Not gated by requireAdmin — called from the webhook route and any
 * server-only code that needs to actually use the credentials (never
 * gated by a user session; the webhook authenticates via Meta's HMAC
 * signature instead). DB value wins when set, otherwise falls back to the
 * matching env var so a bare .env-only setup keeps working.
 */
export async function getWhatsAppCredentials(): Promise<WhatsAppCredentials> {
  const row = await fetchIntegrationSettings();
  return {
    accessToken: row?.whatsappAccessToken || process.env.WHATSAPP_ACCESS_TOKEN || null,
    appSecret: row?.whatsappAppSecret || process.env.WHATSAPP_APP_SECRET || null,
    phoneNumberId:
      row?.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || null,
    verifyToken:
      row?.whatsappVerifyToken || process.env.WHATSAPP_VERIFY_TOKEN || null,
  };
}

/**
 * Reference wording for the 5 templates, edited from the admin UI's
 * WhatsApp-style body editor. DB value wins when set, otherwise falls back
 * to a sensible default — see DEFAULT_TEMPLATE_BODIES above. Used to derive
 * the positional params sent to Meta (~/lib/whatsapp-template-vars), not
 * sent to Meta directly.
 */
export async function getWhatsAppTemplateBodies(): Promise<WhatsAppTemplateBodies> {
  const row = await fetchIntegrationSettings();
  return {
    newArrivals:
      (row as unknown as { whatsappTemplateNewArrivalsBody?: string | null })
        ?.whatsappTemplateNewArrivalsBody || DEFAULT_TEMPLATE_BODIES.newArrivals,
    orderCancelledRefunded:
      row?.whatsappTemplateOrderCancelledRefundedBody ||
      DEFAULT_TEMPLATE_BODIES.orderCancelledRefunded,
    orderConfirmed:
      row?.whatsappTemplateOrderConfirmedBody ||
      DEFAULT_TEMPLATE_BODIES.orderConfirmed,
    orderShipped:
      row?.whatsappTemplateOrderShippedBody || DEFAULT_TEMPLATE_BODIES.orderShipped,
    orderStatusUpdate:
      row?.whatsappTemplateOrderStatusUpdateBody ||
      DEFAULT_TEMPLATE_BODIES.orderStatusUpdate,
  };
}

/**
 * Names of the 5 approved Meta message templates this app sends. DB value
 * wins when set, otherwise falls back to the matching WHATSAPP_TEMPLATE_*
 * env var, then a hardcoded default name — see the WhatsApp tutorial dialog
 * on /admin/settings (~/app/admin/settings/tutorial-dialog) for what each
 * template's approved body must say and how many {{n}} params it needs.
 */
export async function getWhatsAppTemplateNames(): Promise<WhatsAppTemplateNames> {
  const row = await fetchIntegrationSettings();
  return {
    newArrivals:
      (row as unknown as { whatsappTemplateNewArrivals?: string | null })
        ?.whatsappTemplateNewArrivals ||
      process.env.WHATSAPP_TEMPLATE_NEW_ARRIVALS ||
      "new_arrivals",
    orderCancelledRefunded:
      row?.whatsappTemplateOrderCancelledRefunded ||
      process.env.WHATSAPP_TEMPLATE_ORDER_CANCELLED_REFUNDED ||
      "order_cancelled_refunded",
    orderConfirmed:
      row?.whatsappTemplateOrderConfirmed ||
      process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMED ||
      "order_confirmed",
    orderShipped:
      row?.whatsappTemplateOrderShipped ||
      process.env.WHATSAPP_TEMPLATE_ORDER_SHIPPED ||
      "order_shipped",
    orderStatusUpdate:
      row?.whatsappTemplateOrderStatusUpdate ||
      process.env.WHATSAPP_TEMPLATE_ORDER_STATUS_UPDATE ||
      "order_status_update",
  };
}

export async function updateIntegrationSettings(
  input: UpdateIntegrationSettingsInput,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    await db
      .insert(integrationSettingsTable)
      .values({ id: "default", ...input })
      .onConflictDoUpdate({
        set: { ...input, updatedAt: new Date() },
        target: integrationSettingsTable.id,
      });
    return { success: true };
  } catch (error) {
    console.error("Failed to update integration settings:", error);
    return { error: "Could not save integration settings.", success: false };
  }
}

async function fetchIntegrationSettings(): Promise<IntegrationSettings | null> {
  try {
    return (
      (await db.query.integrationSettingsTable.findFirst({
        where: eq(integrationSettingsTable.id, "default"),
      })) ?? null
    );
  } catch (error) {
    console.error("Failed to fetch integration settings:", error);
    return null;
  }
}
