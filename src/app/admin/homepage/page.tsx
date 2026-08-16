import { getHomepageSettings } from "~/lib/queries/homepage";

import { HomepageSettingsPageClient } from "./page.client";

export default async function AdminHomepageSettingsPage() {
  const settings = await getHomepageSettings();

  return <HomepageSettingsPageClient settings={settings} />;
}