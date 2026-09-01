import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Singleton row (id is always "default") — one row holds the site's
// editable identity so it doesn't need a migration every time branding
// changes. Falls back to hardcoded SEO_CONFIG/SOCIAL_LINKS in ~/app.ts
// until an admin saves this for the first time.
export const siteSettingsTable = pgTable("site_settings", {
  // The homepage's single full-bleed collection banner (CollectionSpotlight)
  // — all nullable, each falls back to that component's own hardcoded
  // "KRS Standard" copy/image when unset, so this never needs a migration
  // of default content, only an opt-in override once an admin fills it in.
  collectionSpotlightBody: text("collection_spotlight_body"),
  collectionSpotlightCtaLabel: text("collection_spotlight_cta_label"),
  collectionSpotlightEyebrow: text("collection_spotlight_eyebrow"),
  collectionSpotlightHref: text("collection_spotlight_href"),
  collectionSpotlightImageUrl: text("collection_spotlight_image_url"),
  collectionSpotlightTitle: text("collection_spotlight_title"),
  description: text("description").notNull(),
  facebookUrl: text("facebook_url"),
  faviconUrl: text("favicon_url"),
  id: text("id").primaryKey().default("default"),
  instagramUrl: text("instagram_url"),
  logoUrl: text("logo_url"),
  name: text("name").notNull(),
  // When true, the public storefront hides prices everywhere and swaps
  // buy/checkout CTAs for a "Contact Us" flow. Admin views are unaffected.
  noMoneyMode: boolean("no_money_mode").default(false).notNull(),
  slogan: text("slogan").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  whatsappNumber: text("whatsapp_number"),
});
