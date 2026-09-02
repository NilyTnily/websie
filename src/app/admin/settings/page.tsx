import { getIntegrationSettings } from "~/lib/queries/integrations";
import { getSiteSettings } from "~/lib/queries/settings";
import { getAllProducts } from "~/lib/queries/catalog";

import { SettingsPageClient } from "./page.client";

export default async function AdminSettingsPage() {
  const [settings, integrationSettings, allProducts] = await Promise.all([
    getSiteSettings(),
    getIntegrationSettings(),
    getAllProducts(),
  ]);

  return (
    <SettingsPageClient
      allProducts={allProducts}
      integrationSettings={integrationSettings}
      settings={settings}
    />
  );
}
