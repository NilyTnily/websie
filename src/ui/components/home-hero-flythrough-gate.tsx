"use client";

import { useEffect, useState } from "react";

import type { ProductWithRelations } from "~/db/schema/catalog/types";

import { HomeHeroFlythrough } from "~/ui/components/home-hero-flythrough";
import { HomeHeroScroll } from "~/ui/components/home-hero-scroll";

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
