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
  whatsappTemplateNewArrivals: text("whatsapp_template_new_arrivals"),
  whatsappTemplateNewArrivalsBody: text(
    "whatsapp_template_new_arrivals_body",
  ),
  // Names of the 5 approved Meta message templates this app sends
  // business-initiated (see ~/lib/queries/whatsapp-notify). Only the NAME
  // is editable here — the approved body wording lives in Meta Business
  // Manager and must match the WhatsApp tutorial dialog on /admin/settings,
  // since Meta rejects a send if the parameter count doesn't match the
  // approved template. Falls back to WHATSAPP_TEMPLATE_* env vars, then a
  // default name, when blank.
  whatsappTemplateOrderCancelledRefunded: text(
    "whatsapp_template_order_cancelled_refunded",
  ),
  whatsappTemplateOrderCancelledRefundedBody: text(
    "whatsapp_template_order_cancelled_refunded_body",
  ),
  whatsappTemplateOrderConfirmed: text("whatsapp_template_order_confirmed"),
  whatsappTemplateOrderConfirmedBody: text(
    "whatsapp_template_order_confirmed_body",
  ),
  whatsappTemplateOrderShipped: text("whatsapp_template_order_shipped"),
  whatsappTemplateOrderShippedBody: text(
    "whatsapp_template_order_shipped_body",
  ),
  whatsappTemplateOrderStatusUpdate: text(
    "whatsapp_template_order_status_update",
  ),
  // Reference wording for each template, edited from the admin UI using
  // named {{variable}} tokens (first_name, last_name, full_name,
  // order_number, total, status, tracking_url) — NOT sent to Meta directly.
  // Meta only accepts the approved body it already has on file, addressed
  // positionally as {{1}}, {{2}}, ... We use this text purely to derive
  // that position order: ~/lib/whatsapp-template-vars scans the tokens in
  // the order they appear here and builds the params array to match, so
  // editing wording/reordering variables here must be mirrored in the
  // template actually submitted to Meta for approval.
  whatsappTemplateOrderStatusUpdateBody: text(
    "whatsapp_template_order_status_update_body",
  ),
  whatsappVerifyToken: text("whatsapp_verify_token"),
});
