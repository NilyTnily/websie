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
    whatsappAccessToken: optionalText(formData, "whatsappAccessToken"),
    whatsappAppSecret: optionalText(formData, "whatsappAppSecret"),
    whatsappPhoneNumberId: optionalText(formData, "whatsappPhoneNumberId"),
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

  const result = await updateSiteSettings({
    description,
    facebookUrl: optionalText(formData, "facebookUrl"),
    faviconUrl: optionalText(formData, "faviconUrl"),
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
