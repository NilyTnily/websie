"use server";

import { revalidatePath } from "next/cache";

import { updateIntegrationSettings } from "~/lib/queries/integrations";
import { updateSiteSettings } from "~/lib/queries/settings";

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

export async function updateIntegrationSettingsAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const result = await updateIntegrationSettings({
    googleClientId: optionalText(formData, "googleClientId"),
    googleClientSecret: optionalText(formData, "googleClientSecret"),
    whatsappAccessToken: optionalText(formData, "whatsappAccessToken"),
    whatsappAppSecret: optionalText(formData, "whatsappAppSecret"),
    whatsappPhoneNumberId: optionalText(formData, "whatsappPhoneNumberId"),
    whatsappTemplateNewArrivals: optionalText(
      formData,
      "whatsappTemplateNewArrivals",
    ),
    whatsappTemplateNewArrivalsBody: optionalText(
      formData,
      "whatsappTemplateNewArrivalsBody",
    ),
    whatsappTemplateOrderCancelledRefunded: optionalText(
      formData,
      "whatsappTemplateOrderCancelledRefunded",
    ),
    whatsappTemplateOrderCancelledRefundedBody: optionalText(
      formData,
      "whatsappTemplateOrderCancelledRefundedBody",
    ),
    whatsappTemplateOrderConfirmed: optionalText(
      formData,
      "whatsappTemplateOrderConfirmed",
    ),
    whatsappTemplateOrderConfirmedBody: optionalText(
      formData,
      "whatsappTemplateOrderConfirmedBody",
    ),
    whatsappTemplateOrderShipped: optionalText(
      formData,
      "whatsappTemplateOrderShipped",
    ),
    whatsappTemplateOrderShippedBody: optionalText(
      formData,
      "whatsappTemplateOrderShippedBody",
    ),
    whatsappTemplateOrderStatusUpdate: optionalText(
      formData,
      "whatsappTemplateOrderStatusUpdate",
    ),
    whatsappTemplateOrderStatusUpdateBody: optionalText(
      formData,
      "whatsappTemplateOrderStatusUpdateBody",
    ),
    whatsappVerifyToken: optionalText(formData, "whatsappVerifyToken"),
  });

  if (!result.success) return { error: result.error };

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateSiteSettingsAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const name = textField(formData, "name");
  const slogan = textField(formData, "slogan");
  const description = textField(formData, "description");

  if (!name || !slogan || !description) {
    return { error: "Name, slogan, and description are required." };
  }

  const parseIds = (key: string, max: number): string[] | null => {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) return null;
    try {
      const arr = JSON.parse(raw) as unknown;
      if (!Array.isArray(arr)) return null;
      const ids = arr.filter((x): x is string => typeof x === "string").slice(0, max);
      return ids.length > 0 ? ids : null;
    } catch {
      return null;
    }
  };

  const result = await updateSiteSettings({
    description,
    facebookUrl: optionalText(formData, "facebookUrl"),
    faviconUrl: optionalText(formData, "faviconUrl"),
    homeHeroDesktopImageUrl: optionalText(formData, "homeHeroDesktopImageUrl"),
    homeHeroMobileImageUrl: optionalText(formData, "homeHeroMobileImageUrl"),
    homeLoupeImageUrl: optionalText(formData, "homeLoupeImageUrl"),
    homeNewPiecesIds: parseIds("homeNewPiecesIds", 10),
    homeShopTheLookIds: parseIds("homeShopTheLookIds", 2),
    homeSpotlightImageUrl: optionalText(formData, "homeSpotlightImageUrl"),
    instagramUrl: optionalText(formData, "instagramUrl"),
    logoUrl: optionalText(formData, "logoUrl"),
    name,
    noMoneyMode: formData.get("noMoneyMode") === "on",
    slogan,
    whatsappNumber: optionalText(formData, "whatsappNumber"),
  });

  if (!result.success) return { error: result.error };

  revalidatePath("/", "layout");
  return { success: true };
}

function optionalText(formData: FormData, key: string): null | string {
  return textField(formData, key) || null;
}

function textField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
