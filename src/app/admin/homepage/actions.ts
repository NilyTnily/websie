"use server";

import { revalidatePath } from "next/cache";

import { updateHomepageSettings } from "~/lib/queries/homepage";

export interface HomepageSettingsFormState {
  error?: string;
  success?: boolean;
}

export async function updateHomepageSettingsAction(
  _prevState: HomepageSettingsFormState,
  formData: FormData,
): Promise<HomepageSettingsFormState> {
  const heroTitle = textField(formData, "heroTitle");
  const heroSubtitle = textField(formData, "heroSubtitle");
  const heroCtaText = textField(formData, "heroCtaText");
  const heroCtaHref = textField(formData, "heroCtaHref");
  const collectionsTitle = textField(formData, "collectionsTitle");
  const featuredTitle = textField(formData, "featuredTitle");
  const featuredCtaText = textField(formData, "featuredCtaText");
  const featuredCtaHref = textField(formData, "featuredCtaHref");
  const testimonialsTitle = textField(formData, "testimonialsTitle");
  const testimonialsDescription = textField(formData, "testimonialsDescription");
  const ctaTitle = textField(formData, "ctaTitle");
  const ctaDescription = textField(formData, "ctaDescription");
  const ctaPrimaryText = textField(formData, "ctaPrimaryText");
  const ctaPrimaryHref = textField(formData, "ctaPrimaryHref");
  const ctaSecondaryText = textField(formData, "ctaSecondaryText");
  const ctaSecondaryHref = textField(formData, "ctaSecondaryHref");

  if (
    !heroTitle ||
    !heroSubtitle ||
    !heroCtaText ||
    !heroCtaHref ||
    !collectionsTitle ||
    !featuredTitle ||
    !featuredCtaText ||
    !featuredCtaHref ||
    !testimonialsTitle ||
    !testimonialsDescription ||
    !ctaTitle ||
    !ctaDescription ||
    !ctaPrimaryText ||
    !ctaPrimaryHref ||
    !ctaSecondaryText ||
    !ctaSecondaryHref
  ) {
    return { error: "All text fields are required." };
  }

  const result = await updateHomepageSettings({
    collectionsTitle,
    ctaDescription,
    ctaPrimaryHref,
    ctaPrimaryText,
    ctaSecondaryHref,
    ctaSecondaryText,
    ctaTitle,
    featuredCtaHref,
    featuredCtaText,
    featuredTitle,
    heroCtaHref,
    heroCtaText,
    heroSubtitle,
    heroTitle,
    heroVideoPoster: optionalText(formData, "heroVideoPoster"),
    heroVideoUrl: optionalText(formData, "heroVideoUrl"),
    testimonialsDescription,
    testimonialsTitle,
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