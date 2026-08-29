"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import type { ProductWithRelations } from "~/db/schema/catalog/types";

import { HomeHeroScroll } from "~/ui/components/home-hero-scroll";

const HomeHeroFlythrough = dynamic(
  () => import("~/ui/components/home-hero-flythrough").then((m) => m.HomeHeroFlythrough),
  { loading: () => <HomeHeroScroll className="bg-krs-onyx" />, ssr: false },
);

interface HomeHeroFlythroughGateProps {
  className?: string;
  tableProducts: ProductWithRelations[];
}

/**
 * prefers-reduced-motion gate: the SVG watch-mechanism hero is the fallback
 * (calmer and more polished than a flat still), not a retired component.
 */
export function HomeHeroFlythroughGate({
  className,
  tableProducts,
}: HomeHeroFlythroughGateProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  if (reduceMotion) {
    return <HomeHeroScroll className={className} />;
  }

  return (
    <HomeHeroFlythrough className={className} tableProducts={tableProducts} />
  );
}
