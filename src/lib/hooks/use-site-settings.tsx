"use client";

import * as React from "react";

import type { SiteSettings } from "~/db/schema";

const SiteSettingsContext = React.createContext<null | SiteSettings>(null);

interface SiteSettingsProviderProps {
  children: React.ReactNode;
  settings: SiteSettings;
}

export function SiteSettingsProvider({
  children,
  settings,
}: SiteSettingsProviderProps) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  const settings = React.useContext(SiteSettingsContext);
  if (!settings) {
    throw new Error(
      "useSiteSettings must be used within a SiteSettingsProvider",
    );
  }
  return settings;
}
