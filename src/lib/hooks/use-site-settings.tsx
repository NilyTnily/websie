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
  return <SiteSettingsContext value={settings}>{children}</SiteSettingsContext>;
}

export function useSiteSettings(): SiteSettings {
  const settings = React.use(SiteSettingsContext);
  if (!settings) {
    // During RSC flight / Suspense boundaries the provider can be temporarily
    // absent (e.g. header rendered in fallback). Return a safe default instead
    // of throwing and crashing the header on client navigation.
    return {
      description: "KRS — Precision worn close.",
      facebookUrl: null,
      faviconUrl: null,
      id: "default",
      instagramUrl: null,
      logoUrl: null,
      name: "KRS",
      noMoneyMode: true,
      slogan: "Precision worn close.",
      updatedAt: new Date(0),
      whatsappNumber: null,
    } as SiteSettings;
  }
  return settings;
}
