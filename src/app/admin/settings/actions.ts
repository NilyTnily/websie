"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

import { db } from "~/db";
import { categoryTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";
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
    homeJewelryHeroImageUrl: optionalText(formData, "homeJewelryHeroImageUrl"),
    homeLoupeImageUrl: optionalText(formData, "homeLoupeImageUrl"),
    homeNewPiecesIds: parseIds("homeNewPiecesIds", 10),
    homeShopTheLookIds: parseIds("homeShopTheLookIds", 2),
    homeSpotlightImageUrl: optionalText(formData, "homeSpotlightImageUrl"),
    homeWatchesHeroImageUrl: optionalText(formData, "homeWatchesHeroImageUrl"),
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

export async function updateCategoryImage(
  id: string,
  image: string,
): Promise<{ error?: string; success: boolean }> {
  await requireAdmin();
  if (!id || !image) return { error: "Missing id or image", success: false };
  try {
    await db.update(categoryTable).set({ image, updatedAt: new Date() }).where(eq(categoryTable.id, id));
    revalidateTag("categories");
    revalidateTag("site-settings");
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update category image:", error);
    return { error: "Could not update the category image.", success: false };
  }
}

export async function updateCategoryImageAction(
  formData: FormData,
): Promise<{ error?: string; success: boolean }> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  if (!id || !image) return { error: "Missing id or image", success: false };
  try {
    await db.update(categoryTable).set({ image, updatedAt: new Date() }).where(eq(categoryTable.id, id));
    revalidateTag("categories");
    revalidateTag("site-settings");
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update category image:", error);
    return { error: "Could not update the category image.", success: false };
  }
}

function textField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
