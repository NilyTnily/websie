import "server-only";
import { eq } from "drizzle-orm";

import type { HomepageSettings } from "~/db/schema";

import { db } from "~/db";
import { homepageSettingsTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";

export interface UpdateHomepageSettingsInput {
  collectionsTitle: string;
  ctaDescription: string;
  ctaPrimaryHref: string;
  ctaPrimaryText: string;
  ctaSecondaryHref: string;
  ctaSecondaryText: string;
  ctaTitle: string;
  featuredCtaHref: string;
  featuredCtaText: string;
  featuredTitle: string;
  heroCtaHref: string;
  heroCtaText: string;
  heroSubtitle: string;
  heroTitle: string;
  heroVideoPoster: null | string;
  heroVideoUrl: null | string;
  testimonialsDescription: string;
  testimonialsTitle: string;
}

const DEFAULT_SETTINGS: HomepageSettings = {
  collectionsTitle: "Collections",
  ctaDescription:
    "Track orders, save pieces to a wishlist, and keep a record of every service and restoration on your collection.",
  ctaPrimaryHref: "/auth/sign-up",
  ctaPrimaryText: "Create Account",
  ctaSecondaryHref: "/products",
  ctaSecondaryText: "Browse the Collection",
  ctaTitle: "Open a client account",
  featuredCtaHref: "/products",
  featuredCtaText: "View all",
  featuredTitle: "From the Current Shelf",
  heroCtaHref: "/products",
  heroCtaText: "Discover",
  heroSubtitle:
    "Automatic movements finished by hand, stones set one at a time, and a small archive of vintage pieces restored ourselves.",
  heroTitle: "Precision worn close.",
  heroVideoPoster: null,
  heroVideoUrl: "/luxury-watch-cgi-animation.mp4",
  id: "default",
  testimonialsDescription: "Notes from the client book — unedited, on request.",
  testimonialsTitle: "From the Client Book",
  updatedAt: new Date(0),
};

export async function getHomepageSettings(): Promise<HomepageSettings> {
  try {
    const row = await db.query.homepageSettingsTable.findFirst({
      where: eq(homepageSettingsTable.id, "default"),
    });
    return row ?? DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to fetch homepage settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateHomepageSettings(
  input: UpdateHomepageSettingsInput,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    await db
      .insert(homepageSettingsTable)
      .values({ id: "default", ...input })
      .onConflictDoUpdate({
        set: { ...input, updatedAt: new Date() },
        target: homepageSettingsTable.id,
      });
    return { success: true };
  } catch (error) {
    console.error("Failed to update homepage settings:", error);
    return { error: "Could not save homepage settings.", success: false };
  }
}