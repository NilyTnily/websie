import "server-only";
import { eq } from "drizzle-orm";

import type { IntegrationSettings } from "~/db/schema";

import { db } from "~/db";
import { integrationSettingsTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";

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
  whatsappVerifyToken: null | string;
}

export interface WhatsAppCredentials {
  accessToken: null | string;
  appSecret: null | string;
  phoneNumberId: null | string;
  verifyToken: null | string;
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
