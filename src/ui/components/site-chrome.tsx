"use client";

import { usePathname } from "next/navigation";

import { Footer } from "~/ui/components/footer";
import { Header } from "~/ui/components/header/header";

const CHROMELESS_PREFIXES = ["/admin", "/auth"];

interface SiteChromeProps {
  children: React.ReactNode;
}

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  // The homepage is the scroll-jacked hero flythrough — it renders its own
  // Header (see app/page.tsx) and never lets scroll reach a Footer below it,
  // so both are skipped here rather than compared by prefix like the rest
  // (every route "starts with" "/", so it can't join CHROMELESS_PREFIXES).
  const hideChrome =
    pathname === "/" ||
    CHROMELESS_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Header showAuth={true} />
      <main className="flex min-h-screen flex-col">{children}</main>
      <Footer />
    </>
  );
}
