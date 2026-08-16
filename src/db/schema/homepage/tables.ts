import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const homepageSettingsTable = pgTable("homepage_settings", {
  collectionsTitle: text("collections_title").notNull().default("Collections"),
  ctaDescription: text("cta_description").notNull().default("Track orders, save pieces to a wishlist, and keep a record of every service and restoration on your collection."),
  ctaPrimaryHref: text("cta_primary_href").notNull().default("/auth/sign-up"),
  ctaPrimaryText: text("cta_primary_text").notNull().default("Create Account"),
  ctaSecondaryHref: text("cta_secondary_href").notNull().default("/products"),
  ctaSecondaryText: text("cta_secondary_text").notNull().default("Browse the Collection"),
  ctaTitle: text("cta_title").notNull().default("Open a client account"),
  featuredCtaHref: text("featured_cta_href").notNull().default("/products"),
  featuredCtaText: text("featured_cta_text").notNull().default("View all"),
  featuredTitle: text("featured_title").notNull().default("From the Current Shelf"),
  heroCtaHref: text("hero_cta_href").notNull().default("/products"),
  heroCtaText: text("hero_cta_text").notNull().default("Discover"),
  heroSubtitle: text("hero_subtitle").notNull().default(
    "Automatic movements finished by hand, stones set one at a time, and a small archive of vintage pieces restored ourselves."
  ),
  heroTitle: text("hero_title").notNull().default("Precision worn close."),
  heroVideoPoster: text("hero_video_poster"),
  heroVideoUrl: text("hero_video_url"),
  id: text("id").primaryKey().default("default"),
  testimonialsDescription: text("testimonials_description").notNull().default("Notes from the client book — unedited, on request."),
  testimonialsTitle: text("testimonials_title").notNull().default("From the Client Book"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});