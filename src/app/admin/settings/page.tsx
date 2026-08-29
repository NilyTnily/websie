import { getIntegrationSettings } from "~/lib/queries/integrations";
import { getSiteSettings } from "~/lib/queries/settings";

import { SettingsPageClient } from "./page.client";

export default async function AdminSettingsPage() {
  const [settings, integrationSettings] = await Promise.all([
    getSiteSettings(),
    getIntegrationSettings(),
  ]);

  return (
    <SettingsPageClient
      integrationSettings={integrationSettings}
      settings={settings}
    />
  );
}
