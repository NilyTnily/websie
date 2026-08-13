import "server-only";
import { eq } from "drizzle-orm";

import type { SiteSettings } from "~/db/schema";

import { SEO_CONFIG, SOCIAL_LINKS } from "~/app";
import { db } from "~/db";
import { siteSettingsTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";

export interface UpdateSiteSettingsInput {
  description: string;
  facebookUrl: null | string;
  faviconUrl: null | string;
  instagramUrl: null | string;
  logoUrl: null | string;
  name: string;
  slogan: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  description: SEO_CONFIG.description,
  facebookUrl: SOCIAL_LINKS.facebook || null,
  faviconUrl: null,
  id: "default",
  instagramUrl: SOCIAL_LINKS.instagram || null,
  logoUrl: null,
  name: SEO_CONFIG.name,
  slogan: SEO_CONFIG.slogan,
  updatedAt: new Date(0),
};

/** Falls back to the hardcoded SEO_CONFIG/SOCIAL_LINKS defaults until an admin saves settings for the first time. */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const row = await db.query.siteSettingsTable.findFirst({
      where: eq(siteSettingsTable.id, "default"),
    });
    return row ?? DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSiteSettings(
  input: UpdateSiteSettingsInput,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    await db
      .insert(siteSettingsTable)
      .values({ id: "default", ...input })
      .onConflictDoUpdate({
        set: { ...input, updatedAt: new Date() },
        target: siteSettingsTable.id,
      });
    return { success: true };
  } catch (error) {
    console.error("Failed to update site settings:", error);
    return { error: "Could not save site settings.", success: false };
  }
}
