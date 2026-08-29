"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import type { ProductWithRelations } from "~/db/schema/catalog/types";

const HomeHeroFlythrough = dynamic(
  () => import("~/ui/components/home-hero-flythrough").then((m) => m.HomeHeroFlythrough),
  { loading: () => <div className="bg-krs-onyx h-full w-full" />, ssr: false },
);

interface HomeHeroFlythroughGateProps {
  className?: string;
  tableProducts: ProductWithRelations[];
}

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
    return <div className={`bg-krs-onyx ${className ?? ""}`} />;
  }

  return (
    <div
      className={`
        bg-krs-onyx
        min-h-screen
        relative
        overflow-hidden
        ${className ?? ""}
      `}
    >
      {/* Fallback background for when video autoplay is blocked on mobile */}
      <div
        className={`
          absolute inset-0
          bg-gradient-to-b
          from-krs-onyx via-krs-mocha to-krs-onyx
        `}
      />
      <HomeHeroFlythrough
        className={className}
        tableProducts={tableProducts}
      />
    </div>
  );
}
