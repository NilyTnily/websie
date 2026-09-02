"use client";

import { useEffect, useRef, useState } from "react";

import type { ProductWithRelations } from "~/db/schema/catalog/types";

import { cn } from "~/lib/cn";

interface HomeHeroFlythroughProps {
  className?: string;
  tableProducts: ProductWithRelations[];
}

const ASSET_BASE = "/hero-flythrough";

// Same clip previously shared by the "storefront" and "table" scroll
// scenes — storefront is its first frame, table is its tail. Playing it
// natively start-to-end (see `handleTimeUpdate` below) reproduces that
// same beat without any scroll involved.
const TABLE_LANDING_FRACTION = 0.9869;
// A couple of frames' worth of hold so the reveal reads as "arrived", not
// a mid-motion pop the instant playback happens to cross the fraction.
const TABLE_FADE_IN_MS = 96;

const TABLE_VIDEO_WIDTH = 2520;
const TABLE_VIDEO_HEIGHT = 1440;
const TABLE_VIDEO_OBJECT_POSITION_X = 0.5; // "center"
const TABLE_VIDEO_OBJECT_POSITION_Y = 0.42; // "42%"

// Anchors for the velvet display tray, expressed as fractions of the SOURCE
// VIDEO FRAME (0..1 on each axis) rather than the viewport — see
// mapCutoutSlot below for how these project onto the actual viewport.
// Desktop framing only; mobile renders its own independent, centered grid.
const TABLE_CUTOUT_SLOTS = [
  { wFrac: 0.08, xFrac: 0.380, yFrac: 0.375 },
  { wFrac: 0.08, xFrac: 0.508, yFrac: 0.375 },
  { wFrac: 0.08, xFrac: 0.636, yFrac: 0.375 },
  { wFrac: 0.08, xFrac: 0.315, yFrac: 0.620 },
  { wFrac: 0.08, xFrac: 0.445, yFrac: 0.620 },
  { wFrac: 0.08, xFrac: 0.573, yFrac: 0.620 },
  { wFrac: 0.08, xFrac: 0.701, yFrac: 0.620 },
];

/**
 * Boutique fly-through hero. Plays a single video clip natively from its
 * first frame (storefront exterior) to its tail (the display tray) the
 * moment it loads, then holds on that last frame — no scroll involvement
 * at all, on either mobile or desktop, so the page underneath is always a
 * completely normal, freely-scrollable document from the very first paint.
 */
export function HomeHeroFlythrough({
  className,
  tableProducts,
}: HomeHeroFlythroughProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tableCutouts = tableProducts
    .filter((product) => product.tableCutoutUrl)
    .slice(0, TABLE_CUTOUT_SLOTS.length);
  // True once playback has reached (and held on) the table frame.
  const [isTableSettled, setIsTableSettled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Feeds mapCutoutSlot so the table cutouts are recomputed against the
  // *current* viewport on every resize. Deterministic default for SSR/
  // hydration; real size synced in the effect below.
  const [viewportSize, setViewportSize] = useState(() => ({
    height: 1080,
    width: 1920,
  }));
  const hasSettledRef = useRef(false);

  useEffect(() => {
    const query = window.matchMedia(
      "(hover: none) and (pointer: coarse), (max-width: 860px)",
    );
    setIsMobile(query.matches);
    function updateViewportSize() {
      setViewportSize({ height: window.innerHeight, width: window.innerWidth });
    }
    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Coalesced against rapid timeupdate ticks — once we've crossed the
    // landing fraction, pause and hold there instead of letting playback
    // run to the clip's literal final frame (which the original scroll
    // tuning deliberately stopped just short of).
    function handleTimeUpdate() {
      if (!video || hasSettledRef.current) return;
      if (video.duration && video.currentTime / video.duration >= TABLE_LANDING_FRACTION) {
        hasSettledRef.current = true;
        video.pause();
        setIsTableSettled(true);
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate);
    // autoPlay covers the common case; calling play() explicitly here
    // catches browsers that hold off until a script-initiated call even
    // with the autoplay attribute present (notably iOS Safari).
    void video.play().catch(() => {
      // Autoplay blocked (rare with muted+playsInline, but possible) —
      // the poster frame stays visible; nothing more to do.
    });

    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [isMobile]);

  function handleSkip() {
    const video = videoRef.current;
    if (hasSettledRef.current) return;
    hasSettledRef.current = true;
    if (video) {
      try {
        if (video.duration && Number.isFinite(video.duration)) {
          video.currentTime = video.duration * TABLE_LANDING_FRACTION;
        }
      } catch {
        // seek may throw if metadata not yet loaded — still settle visually
      }
      video.pause();
    }
    setIsTableSettled(true);
  }

  const clip = isMobile
    ? `${ASSET_BASE}/leg1-mobile.mp4`
    : `${ASSET_BASE}/leg1-final.mp4`;
  const poster = isMobile
    ? `${ASSET_BASE}/scene1-mobile.webp`
    : `${ASSET_BASE}/scene1-desktop.webp`;

  return (
    <div className={`
      relative overflow-hidden
      ${className ?? ""}
    `}>
      <video
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        key={clip}
        muted
        playsInline
        poster={poster}
        preload="auto"
        ref={videoRef}
        style={{
          objectPosition: `${TABLE_VIDEO_OBJECT_POSITION_X * 100}% ${TABLE_VIDEO_OBJECT_POSITION_Y * 100}%`,
        }}
      >
        <source src={clip} type="video/mp4" />
      </video>

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(13,13,13,0.85) 0%, rgba(13,13,13,0.45) 45%, rgba(13,13,13,0.1) 75%, transparent 100%)",
        }}
      />

      <button
        aria-label="Skip video"
        className={`
          absolute top-6 right-6 z-20 rounded-full border border-krs-ivory/40
          px-6 py-3 text-sm font-semibold text-krs-ivory transition-transform
          hover:-translate-y-0.5
          sm:top-10 sm:right-14
        `}
        onClick={handleSkip}
        style={{
          opacity: isTableSettled ? 0 : 1,
          pointerEvents: isTableSettled ? "none" : "auto",
          transition: "opacity 300ms ease",
        }}
        type="button"
      >
        Skip
      </button>

      <div
        className={cn(
          `
            absolute right-6 bottom-6 left-6
            sm:right-14 sm:bottom-10 sm:left-14
          `,
          // krs-hero-in's `animation: … both` pins opacity at 1 for the
          // life of the element (CSS animations win over inline styles on
          // the same property) — so it has to come OFF once settled, or
          // the inline opacity below is silently overridden back to 1 and
          // this copy stays visible, overlapping the table copy underneath
          // it. That was the "text glitching" — both blocks readable at
          // once instead of one cleanly replacing the other.
          !isTableSettled && "krs-hero-in",
        )}
        style={{
          opacity: isTableSettled ? 0 : 1,
          pointerEvents: isTableSettled ? "none" : "auto",
          transition: "opacity 400ms ease",
        }}
      >
        <div className="max-w-[460px]">
          <span className="krs-eyebrow text-krs-champagne">
            Fine watches & jewelry
          </span>
          <h1
            className={`
              mt-3 font-display text-4xl leading-[1.03] text-krs-ivory
              sm:text-6xl
            `}
          >
            Step into KRS
          </h1>
          <p className={`
            mt-4 max-w-[40ch] text-base leading-relaxed text-krs-ivory/80
          `}>
            A small house on a quiet street — every piece serviced in-house,
            every case fitted before it leaves the bench.
          </p>
        </div>
      </div>

      <div
        className={`
          absolute right-6 bottom-6 left-6
          sm:right-14 sm:bottom-10 sm:left-14
        `}
        style={{
          opacity: isTableSettled ? 1 : 0,
          pointerEvents: isTableSettled ? "auto" : "none",
          transition: `opacity ${isTableSettled ? TABLE_FADE_IN_MS : 0}ms ease`,
        }}
      >
        <span className="krs-eyebrow text-krs-champagne">
          Currently on display
        </span>
        <h2
          className={`
            mt-2 font-display text-2xl text-krs-ivory
            sm:text-3xl
          `}
        >
          What&apos;s on the table today
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            className={`
              rounded-full bg-krs-champagne px-6 py-3 text-sm font-semibold
              text-krs-onyx transition-transform
              hover:-translate-y-0.5
            `}
            href="/watches"
          >
            View all watches
          </a>
          <a
            className={`
              rounded-full border border-krs-ivory/40 px-6 py-3 text-sm
              font-semibold text-krs-ivory transition-transform
              hover:-translate-y-0.5
            `}
            href="/jewelry"
          >
            Shop the collection
          </a>
        </div>
      </div>

      {tableCutouts.length > 0 && (
        <>
          <div
            className={`
              absolute inset-0 z-10 hidden
              md:block
            `}
            style={{
              opacity: isTableSettled ? 1 : 0,
              pointerEvents: "none",
              transition: `opacity ${TABLE_FADE_IN_MS}ms ease`,
            }}
          >
            {tableCutouts.map((product, index) => {
              const slot = TABLE_CUTOUT_SLOTS[index];
              const isTopRow = index < 3;
              const { centerX, centerY, widthPct } = mapCutoutSlot(
                slot,
                viewportSize.width,
                viewportSize.height,
              );
              return (
                <a
                  className={`
                    group absolute
                    hover:z-10
                  `}
                  href={`/products/${product.id}`}
                  key={product.id}
                  style={{
                    left: `${centerX}%`,
                    pointerEvents: isTableSettled ? "auto" : "none",
                    top: `${centerY}%`,
                    transform: "translate(-50%, -50%)",
                    width: `${widthPct}%`,
                  }}
                >
                  {isTopRow && (
                    <p
                      className={`
                        absolute bottom-full left-1/2 z-10 mb-1.5 max-w-[220%]
                        -translate-x-1/2 rounded bg-black/60 px-2 py-0.5
                        text-center font-display text-xs leading-tight
                        break-words whitespace-normal text-krs-ivory opacity-0
                        backdrop-blur-sm transition-opacity duration-200
                        group-hover:text-krs-champagne-light
                        group-hover:opacity-100
                      `}
                    >
                      {product.name}
                    </p>
                  )}
                  <img
                    alt={product.name}
                    className={`
                      block w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]
                      transition-transform duration-300
                      group-hover:scale-105
                    `}
                    decoding="async"
                    loading="lazy"
                    src={product.tableCutoutUrl ?? undefined}
                  />
                  {!isTopRow && (
                    <p
                      className={`
                        absolute top-full left-1/2 z-10 mt-1.5 max-w-[220%]
                        -translate-x-1/2 rounded bg-black/60 px-2 py-0.5
                        text-center font-display text-xs leading-tight
                        break-words whitespace-normal text-krs-ivory opacity-0
                        backdrop-blur-sm transition-opacity duration-200
                        group-hover:text-krs-champagne-light
                        group-hover:opacity-100
                      `}
                    >
                      {product.name}
                    </p>
                  )}
                </a>
              );
            })}
          </div>

          {/* Mobile: 3-per-row grid, vertically centered — independent of
              the video's internal composition (see the note on
              TABLE_CUTOUT_SLOTS above), capped at 6 items. */}
          <div
            className={`
              absolute inset-x-0 top-1/2 z-10 px-5
              md:hidden
            `}
            style={{
              opacity: isTableSettled ? 1 : 0,
              pointerEvents: "none",
              transform: "translateY(-50%)",
              transition: `opacity ${TABLE_FADE_IN_MS}ms ease`,
            }}
          >
            <div className="grid grid-cols-3 gap-x-3 gap-y-8">
              {tableCutouts.slice(0, 6).map((product) => (
                <a
                  className="flex flex-col items-center"
                  href={`/products/${product.id}`}
                  key={product.id}
                  style={{ pointerEvents: isTableSettled ? "auto" : "none" }}
                >
                  <img
                    alt={product.name}
                    className={`
                      h-28 w-auto drop-shadow-[0_6px_12px_rgba(0,0,0,0.55)]
                    `}
                    decoding="async"
                    loading="lazy"
                    src={product.tableCutoutUrl ?? undefined}
                  />
                  <p
                    className={`
                      mt-1.5 line-clamp-1 text-center font-display text-xs
                      text-krs-ivory
                    `}
                  >
                    {product.name}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Inverts CSS `object-fit: cover` + `object-position` to map a point/size
 * expressed as a fraction of the video's OWN frame onto a percentage
 * position within the viewport it renders into. This is what keeps an
 * overlay anchored to a specific spot in the footage (the tray) glued to
 * that spot regardless of the viewport's size or aspect ratio.
 *
 * The returned centerX/centerY are the projected CENTER point of the
 * slot — the caller centers each cutout image on exactly that point
 * (translate(-50%, -50%)).
 */
function mapCutoutSlot(
  slot: { wFrac: number; xFrac: number; yFrac: number },
  viewportWidth: number,
  viewportHeight: number,
): { centerX: number; centerY: number; widthPct: number } {
  const videoAspect = TABLE_VIDEO_WIDTH / TABLE_VIDEO_HEIGHT;
  const viewportAspect = viewportWidth / viewportHeight;
  const scale =
    viewportAspect > videoAspect
      ? viewportWidth / TABLE_VIDEO_WIDTH
      : viewportHeight / TABLE_VIDEO_HEIGHT;
  const renderedWidth = TABLE_VIDEO_WIDTH * scale;
  const renderedHeight = TABLE_VIDEO_HEIGHT * scale;
  const offsetX = (viewportWidth - renderedWidth) * TABLE_VIDEO_OBJECT_POSITION_X;
  const offsetY = (viewportHeight - renderedHeight) * TABLE_VIDEO_OBJECT_POSITION_Y;

  return {
    centerX: ((offsetX + slot.xFrac * renderedWidth) / viewportWidth) * 100,
    centerY: ((offsetY + slot.yFrac * renderedHeight) / viewportHeight) * 100,
    widthPct: ((slot.wFrac * renderedWidth) / viewportWidth) * 100,
  };
}
