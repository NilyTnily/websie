import type { siteSettingsTable } from "./tables";

export type NewSiteSettings = typeof siteSettingsTable.$inferInsert;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
