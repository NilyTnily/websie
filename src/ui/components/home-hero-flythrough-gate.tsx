"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { ProductWithRelations } from "~/db/schema/catalog/types";

const HomeHeroFlythrough = dynamic(
  () => import("~/ui/components/home-hero-flythrough").then((m) => m.HomeHeroFlythrough),
  { loading: () => <div className="h-dvh w-full bg-krs-onyx" />, ssr: false },
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
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    // Live, not just read-once — a user can flip this system setting while
    // the tab is open (or return to it after changing it elsewhere), and
    // the static hero below should react the same way the animated one
    // would have, instead of requiring a full page reload to pick it up.
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  if (reduceMotion) {
    return (
      <StaticHero className={className} tableProducts={tableProducts} />
    );
  }

  return (
    <HomeHeroFlythrough className={className} tableProducts={tableProducts} />
  );
}

// Non-animated equivalent of the storefront scene shown to anyone with
// prefers-reduced-motion enabled — previously this branch rendered a bare
// empty div (just the background color, no image, no copy, no way in), which
// read as "the site is broken" rather than "the site skipped the motion."
// No video, no scroll hijacking, no JS scrub engine — just the same opening
// shot and copy as a normal, static page.
function StaticHero({
  className,
  tableProducts,
}: HomeHeroFlythroughGateProps) {
  const featuredCutouts = tableProducts
    .filter((product) => product.tableCutoutUrl)
    .slice(0, 4);

  return (
    <div
      className={`
        relative overflow-hidden
        ${className ?? ""}
      `}
    >
      <picture>
        <source
          media="(max-width: 860px)"
          srcSet="/hero-flythrough/scene1-mobile.webp"
        />
        <img
          alt="KRS storefront"
          className="absolute inset-0 h-full w-full object-cover"
          src="/hero-flythrough/scene1-desktop.webp"
        />
      </picture>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(13,13,13,0.88) 0%, rgba(13,13,13,0.55) 40%, rgba(13,13,13,0.15) 70%, transparent 100%)",
        }}
      />
      <div className={`
        absolute bottom-6 left-6
        sm:bottom-10 sm:left-14
      `}>
        <div className="max-w-[460px]">
          <span className={`
            font-display text-xs font-bold tracking-[0.16em] text-[#c8a97e]
            uppercase
          `}>
            Fine watches & jewelry
          </span>
          <h1 className={`
            mt-3 font-display text-4xl leading-[1.03] font-bold text-[#f5f2eb]
            sm:text-6xl
          `}>
            Step into KRS
          </h1>
          <p className={`
            mt-4 max-w-[40ch] text-base leading-relaxed text-[#f5f2eb]/80
          `}>
            A small house on a quiet street — every piece serviced in-house,
            every case fitted before it leaves the bench.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className={`
                rounded-full bg-[#c8a97e] px-6 py-3 text-sm font-semibold
                text-[#0d0d0d] transition-transform
                hover:-translate-y-0.5
              `}
              href="/watches"
            >
              View all watches
            </Link>
            <Link
              className={`
                rounded-full border border-[#f5f2eb]/40 px-6 py-3 text-sm
                font-semibold text-[#f5f2eb] transition-transform
                hover:-translate-y-0.5
              `}
              href="/jewelry"
            >
              Shop the collection
            </Link>
          </div>
        </div>
      </div>

      {featuredCutouts.length > 0 && (
        <div className={`
          absolute right-6 bottom-6 z-10 hidden gap-4
          sm:right-14 sm:bottom-10 sm:flex
        `}>
          {featuredCutouts.map((product) => (
            <Link
              className="block w-20"
              href={`/products/${product.id}`}
              key={product.id}
            >
              <img
                alt={product.name}
                className="w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
                src={product.tableCutoutUrl ?? undefined}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
