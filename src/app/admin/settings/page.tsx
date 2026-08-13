import { getSiteSettings } from "~/lib/queries/settings";

import { SettingsPageClient } from "./page.client";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return <SettingsPageClient settings={settings} />;
}
