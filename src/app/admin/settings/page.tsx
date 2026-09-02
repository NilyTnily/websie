import { getIntegrationSettings } from "~/lib/queries/integrations";
import { getSiteSettings } from "~/lib/queries/settings";
import { getAllProducts, getCategoriesWithCounts } from "~/lib/queries/catalog";

import { SettingsPageClient } from "./page.client";

export default async function AdminSettingsPage() {
  const [settings, integrationSettings, allProducts, categories] = await Promise.all([
    getSiteSettings(),
    getIntegrationSettings(),
    getAllProducts(),
    getCategoriesWithCounts(),
  ]);

  return (
    <SettingsPageClient
      allProducts={allProducts}
      categories={categories}
      integrationSettings={integrationSettings}
      settings={settings}
    />
  );
}
