import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Singleton row (id is always "default") — one row holds the site's
// editable identity so it doesn't need a migration every time branding
// changes. Falls back to hardcoded SEO_CONFIG/SOCIAL_LINKS in ~/app.ts
// until an admin saves this for the first time.
export const siteSettingsTable = pgTable("site_settings", {
  description: text("description").notNull(),
  facebookUrl: text("facebook_url"),
  faviconUrl: text("favicon_url"),
  id: text("id").primaryKey().default("default"),
  instagramUrl: text("instagram_url"),
  logoUrl: text("logo_url"),
  name: text("name").notNull(),
  slogan: text("slogan").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
