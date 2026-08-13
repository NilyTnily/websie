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
  const hideChrome = CHROMELESS_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );

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
