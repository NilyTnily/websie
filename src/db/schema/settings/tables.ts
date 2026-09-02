import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Singleton row (id is always "default") — one row holds the site's
// editable identity so it doesn't need a migration every time branding
// changes. Falls back to hardcoded SEO_CONFIG/SOCIAL_LINKS in ~/app.ts
// until an admin saves this for the first time.
export const siteSettingsTable = pgTable("site_settings", {
  description: text("description").notNull(),
  facebookUrl: text("facebook_url"),
  faviconUrl: text("favicon_url"),
  // Homepage — named thumbnails, from scratch (PREMIUM)
  homeHeroDesktopImageUrl: text("home_hero_desktop_image_url"),
  homeHeroMobileImageUrl: text("home_hero_mobile_image_url"),
  homeLoupeImageUrl: text("home_loupe_image_url"),
  homeSpotlightImageUrl: text("home_spotlight_image_url"),
  // Featured selections — PREMIUM: New Pieces up to 10, Shop The Look 2 (ordered ids)
  homeNewPiecesIds: jsonb("home_new_pieces_ids").$type<string[]>(),
  homeShopTheLookIds: jsonb("home_shop_the_look_ids").$type<string[]>(),
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
