import type { integrationSettingsTable } from "./tables";

export type IntegrationSettings = typeof integrationSettingsTable.$inferSelect;
export type NewIntegrationSettings =
  typeof integrationSettingsTable.$inferInsert;
