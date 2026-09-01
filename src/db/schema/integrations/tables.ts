import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Singleton row (id is always "default") for admin-editable integration
// secrets. Deliberately a separate table from site_settings — that table
// is public-readable (rendered on the storefront) and these values are
// credentials that must never be sent to the client. Falls back to the
// matching env var when a field is blank, so setting these in the UI is
// optional — see ~/lib/queries/integrations.
export const integrationSettingsTable = pgTable("integration_settings", {
  googleClientId: text("google_client_id"),
  googleClientSecret: text("google_client_secret"),
  id: text("id").primaryKey().default("default"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  whatsappAccessToken: text("whatsapp_access_token"),
  whatsappAppSecret: text("whatsapp_app_secret"),
  whatsappPhoneNumberId: text("whatsapp_phone_number_id"),
  whatsappVerifyToken: text("whatsapp_verify_token"),
});
