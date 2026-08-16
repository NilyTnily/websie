import type { Metadata } from "next";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Cinzel, Montserrat } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
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

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["200", "300", "400", "500", "600"],
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
          ${cinzel.variable}
          ${montserrat.variable}
          min-h-screen bg-background text-foreground antialiased
          selection:bg-primary/20 selection:text-foreground
        `}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
          enableSystem={false}
        >
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <NuqsAdapter>
            <SiteSettingsProvider settings={settings}>
              <CartProvider>
                <WishlistProvider>
                  <SiteChrome>{children}</SiteChrome>
                  <Toaster />
                </WishlistProvider>
              </CartProvider>
            </SiteSettingsProvider>
          </NuqsAdapter>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
