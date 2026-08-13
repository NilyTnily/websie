import type { Metadata } from "next";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { EB_Garamond, IBM_Plex_Mono, Playfair_Display } from "next/font/google";
import { extractRouterConfig } from "uploadthing/server";

import { ourFileRouter } from "~/app/api/uploadthing/core";
import { CartProvider } from "~/lib/hooks/use-cart";
import { SiteSettingsProvider } from "~/lib/hooks/use-site-settings";
import { WishlistProvider } from "~/lib/hooks/use-wishlist";
import { getSiteSettings } from "~/lib/queries/settings";
import "~/css/globals.css";
import { SiteChrome } from "~/ui/components/site-chrome";
import { ThemeProvider } from "~/ui/components/theme-provider";
import { Toaster } from "~/ui/primitives/sonner";

const playfair = Playfair_Display({
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

const garamond = EB_Garamond({
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-garamond",
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    description: settings.description,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
    title: `${settings.name} — ${settings.slogan}`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${playfair.variable}
          ${garamond.variable}
          ${plexMono.variable}
          min-h-screen bg-background text-foreground antialiased
          selection:bg-primary/20 selection:text-foreground
        `}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
          enableSystem
        >
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <SiteSettingsProvider settings={settings}>
            <CartProvider>
              <WishlistProvider>
                <SiteChrome>{children}</SiteChrome>
                <Toaster />
              </WishlistProvider>
            </CartProvider>
          </SiteSettingsProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
