"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import type { ProductWithRelations } from "~/db/schema/catalog/types";

interface HomeHeroFlythroughProps {
  className?: string;
  tableProducts: ProductWithRelations[];
}

declare global {
  interface Window {
    mountScrollWorld?: (
      container: HTMLElement,
      config: Record<string, unknown>,
    ) => void;
  }
}

const ASSET_BASE = "/hero-flythrough";

// Must stay in sync with each section's `scroll` weight passed to
// mountScrollWorld below — the live overlay and the one-gesture-one-scene
// jump logic both reimplement the engine's own scroll-position math so they
// stay in sync with it without reaching into scrub-engine.js's internals.
const SECTION_SCROLL_WEIGHTS = [1.4, 1.4, 1.6, 1.6];
const SECTION_COUNT = SECTION_SCROLL_WEIGHTS.length;
const TABLE_SECTION_INDEX = 1;
// The table cutouts are revealed by jump-completion state, not scroll
// position — scrub-engine.js's own crossfade (see CROSSFADE in
// scrub-engine.js's read()) keeps a dive's video fully opaque across its
// *entire* scroll range, which is correct for the video itself but was
// wrongly reused here: it made the watch overlay fade in as soon as the
// camera started flying into the table scene, popping in mid-motion well
// before leg2.mp4 actually reached the tray. Instead they reveal the instant
// our own jump animation finishes landed on the table section — no added
// delay — so they read as "instantly there the moment the shot locks in,"
// not a slow separate fade-up after arriving. TABLE_FADE_IN_MS is kept just
// long enough (a couple frames) to avoid a jarring single-frame pop/strobe.
const TABLE_FADE_IN_MS = 120;
// Leaving is intentionally quicker than arriving — once the camera starts
// pulling away from the tray the composited pieces should peel off right
// away, not linger over a scene that's already moving on.
const TABLE_FADE_OUT_MS = 260;
// How far into each section's scroll range to land, per section — NOT a
// single constant. scrub-engine.js gives each section its own copy-opacity
// curve (see read() in scrub-engine.js): section 0 "greets on landing" and
// its copy is fully gone by pr=0.62; middle sections peak exactly at
// pr=0.5; the last section ramps up late and holds its CTA near pr=1. A
// uniform landing fraction breaks legibility on whichever sections don't
// match that one value — these targets are chosen to land each section on
// its own copy-opacity peak while still reading as a composed "arrived"
// shot, not a mid-motion blur.
// Section 0 lands at the true first frame (fraction 0) — deliberately not
// biased forward into the clip.
// The table section is the exception: its title is pinned at 100% by passing
// the same value as `copyPeak` (scrub-engine.js reads `s.copyPeak`), so it
// can land on any chosen frame of leg2.mp4 — leg2 was regenerated for the
// steep table-overhead angle fix (4.04s @ 24fps = 97 frames; 0.93 → frame
// ~90). Watch and jewelry (leg3.mp4, leg4.mp4) are back to their original,
// pre-fix assets, so their landing fractions are unchanged from before:
const TABLE_LANDING_FRACTION = 0.93;
// Watch (leg3.mp4: 6.04s @ 24fps = 145 frames): 80/145 → 0.552.
// Jewelry (leg4.mp4 trimmed to 119 frames): lands 10 frames short of the
// true last frame — frame 109/119 → 0.916. Being the last section, this is
// also the deepest point jumpTo can reach (it clamps to SECTION_COUNT - 1),
// so it functions as the final frame — nothing scrolls past it (see also
// the track-height cap below, which removes the extra scrollable space the
// engine otherwise leaves past this point).
const SECTION_LANDING_FRACTIONS = [0, TABLE_LANDING_FRACTION, 0.552, 0.916];
// Jump duration scales with distance instead of being fixed — the three
// possible hops cover very different scroll distances (storefront→table
// ≈2.7vh, table→watch ≈1.48vh via the connector, watch→jewelry ≈2.18vh; see
// sectionPositions below), so a fixed wall-clock duration for all of them
// gave each a different average pace. Scaling by distance keeps every jump
// moving at roughly the same vh-per-ms rate, which is what actually reads
// as "consistent pace" rather than "consistent stopwatch time." Clamped so
// a very short or very long hop (e.g. a multi-section route-dot skip) still
// feels responsive rather than instant or sluggish.
const MS_PER_VH = 1000;
const MIN_JUMP_DURATION_MS = 1200;
const MAX_JUMP_DURATION_MS = 3000;
const WHEEL_TRIGGER_THRESHOLD = 12;
const TOUCH_TRIGGER_THRESHOLD_PX = 40;

// scrub-engine.js inserts a connector segment between two dives when
// `connectors[i]` is set (see mountScrollWorld below) — used here between
// table and watch (leg2 now ends near-top-down over the tray; leg3 starts
// at eye-level in the gallery, too different a camera position to crossfade
// directly). The connector consumes its own slice of scroll distance in the
// engine's actual segment layout, so sectionPositions() below must add it
// in too or every landing position from watch onward would be wrong by
// this amount — the engine and our own scroll math would disagree about
// where each section starts.
const CONNECTOR_SCROLL_WEIGHT = 0.5;

// The table scene's clip (leg2.mp4) native resolution and CSS
// object-position (see .sw-scene__video in scrub-engine.js's injected CSS)
// — needed to invert object-fit: cover's crop math in mapCutoutSlot below,
// so the cutouts track the tray's actual position in the footage at ANY
// viewport size/aspect ratio instead of drifting off it. A flat
// viewport-percentage anchor only happens to look right at whichever one
// aspect ratio it was eyeballed against — cover crops differently at every
// other ratio, which is exactly what made cutouts sit further and further
// off the tray on very wide, very narrow, or very large screens.
const TABLE_VIDEO_WIDTH = 864;
const TABLE_VIDEO_HEIGHT = 496;
const TABLE_VIDEO_OBJECT_POSITION_X = 0.5; // "center"
const TABLE_VIDEO_OBJECT_POSITION_Y = 0.42; // "42%"

// Anchors for the velvet display tray visible in the table scene's landing
// frame (public/hero-flythrough/scene2-desktop.webp at
// TABLE_LANDING_FRACTION), expressed as fractions of the SOURCE VIDEO
// FRAME (0..1 on each axis) rather than the viewport — that's the
// coordinate system mapCutoutSlot projects onto the current viewport at
// render time. Pixel-measured against the actual frame (guide render in
// .tests/tray-guide.png): outer leather pad spans x 0.17→0.72,
// y 0.135→0.805; the velvet recess floor spans x 0.30→0.675,
// y 0.215→0.705. Columns divide the velvet floor into thirds, rows into
// halves.
//
// IMPORTANT: every anchor below is the CENTER of that watch's IMAGE — not
// its top or bottom edge. mapCutoutSlot positions each cutout by its
// center (see the translate(-50%, -50%) on the anchor), so images with
// slightly different natural sizes or aspect ratios still share each
// row's exact horizontal axis instead of aligning on top/bottom edges.
// Desktop framing only (the mobile clip's object-position and portrait
// crop compose completely differently, so this map doesn't apply there —
// mobile renders its own independent, viewport-centered grid instead, see
// the mobile cutout block below).
// Layout: 2 rows × 3 per line = 6 total.
const TABLE_CUTOUT_SLOTS = [
  // Row 1 — back line, 3 watches (shared center Y) — moved +5% down per user
  { wFrac: 0.08, xFrac: 0.362, yFrac: 0.388 },
  { wFrac: 0.08, xFrac: 0.488, yFrac: 0.388 },
  { wFrac: 0.08, xFrac: 0.612, yFrac: 0.388 },
  // Row 2 — front line, 3 watches (shared center Y) — moved +5% down per user
  { wFrac: 0.08, xFrac: 0.362, yFrac: 0.633 },
  { wFrac: 0.08, xFrac: 0.488, yFrac: 0.633 },
  { wFrac: 0.08, xFrac: 0.612, yFrac: 0.633 },
];

/**
 * Scroll-scrubbed boutique fly-through hero. Mounts the vendored
 * scroll-world engine (public/hero-flythrough/scrub-engine.js) — see
 * .claude/skills/scroll-world/SKILL.md — for the seamless per-scene camera
 * footage, then layers one behavior on top: scroll/swipe/keyboard input is
 * captured and converted into a single discrete jump to the next or
 * previous scene (matching the engine's own 4 route dots) instead of letting
 * scroll continuously scrub through a scene frame by frame.
 */
export function HomeHeroFlythrough({
  className,
  tableProducts,
}: HomeHeroFlythroughProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableCutouts = tableProducts
    .filter((product) => product.tableCutoutUrl)
    .slice(0, TABLE_CUTOUT_SLOTS.length);
  const [engineReady, setEngineReady] = useState(false);
  // True the instant the camera has landed on the table section — see the
  // reveal note by TABLE_FADE_IN_MS above.
  const [isTableSettled, setIsTableSettled] = useState(false);
  // Feeds mapCutoutSlot so the table cutouts are recomputed against the
  // *current* viewport on every resize — this is what makes them track the
  // tray at any window size instead of only looking right at whichever
  // size they happened to be tuned against. Must be deterministic across
  // SSR and hydration — branching on `window` here would make the server
  // render at 1920×1080 while the client hydrates at its real viewport
  // size, which is exactly the hydration mismatch in the error report
  // (left 31% vs 28.89%, etc.). Real size is synced in the effect below.
  const [viewportSize, setViewportSize] = useState(() => ({
    height: 1080,
    width: 1920,
  }));
  const currentIndexRef = useRef(0);
  const isJumpingRef = useRef(false);

  useEffect(() => {
    function updateViewportSize() {
      setViewportSize({ height: window.innerHeight, width: window.innerWidth });
    }
    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  useEffect(() => {
    if (!engineReady || !containerRef.current || !window.mountScrollWorld) {
      return;
    }

    window.mountScrollWorld(containerRef.current, {
      connectors: [undefined, `${ASSET_BASE}/conn-table-watch.mp4`, undefined],
      // One entry per gap between sections (index i = the gap after
      // section i). Only the table→watch gap has a connector — see
      // CONNECTOR_SCROLL_WEIGHT above for why it's needed there.
      connectorsMobile: [
        undefined,
        `${ASSET_BASE}/conn-table-watch-mobile.mp4`,
        undefined,
      ],
      connScroll: CONNECTOR_SCROLL_WEIGHT,
      hint: "scroll to step inside",
      nav: false,
      sections: [
        {
          accent: "#c8a97e",
          body: "A small house on a quiet street — every piece serviced in-house, every case fitted before it leaves the bench.",
          clip: `${ASSET_BASE}/leg1.mp4`,
          clipMobile: `${ASSET_BASE}/leg1-mobile.mp4`,
          eyebrow: "Fine watches & jewelry",
          id: "storefront",
          label: "Storefront",
          scroll: SECTION_SCROLL_WEIGHTS[0],
          still: `${ASSET_BASE}/scene1-desktop.webp`,
          stillMobile: `${ASSET_BASE}/scene1-mobile.webp`,
          title: "Step into KRS",
        },
        {
          accent: "#c8a97e",
          body: "",
          clip: `${ASSET_BASE}/leg2.mp4`,
          clipMobile: `${ASSET_BASE}/leg2-mobile.mp4`,
          copyPeak: TABLE_LANDING_FRACTION,
          // moved title down: was copyPos "top" (pinned at top), now default
          // centered copy so "What's on the table today" sits lower
          eyebrow: "Currently on display",
          id: "table",
          label: "The table",
          scroll: SECTION_SCROLL_WEIGHTS[1],
          still: `${ASSET_BASE}/scene2-desktop.webp`,
          stillMobile: `${ASSET_BASE}/scene2-mobile.webp`,
          title: "What's on the table today",
        },
        {
          accent: "#c8a97e",
          body: "Skeletonized dials, moonphases, hand-finished bridges — the kind of watchmaking worth pausing on.",
          clip: `${ASSET_BASE}/leg3.mp4`,
          clipMobile: `${ASSET_BASE}/leg3-mobile.mp4`,
          eyebrow: "Under the loupe",
          id: "watch",
          label: "Under the loupe",
          linger: 0.4,
          scroll: SECTION_SCROLL_WEIGHTS[2],
          still: `${ASSET_BASE}/scene3-desktop.webp`,
          stillMobile: `${ASSET_BASE}/scene3-mobile.webp`,
          title: "Every complication, considered",
        },
        {
          accent: "#c8a97e",
          body: "Pavé and brilliant-cut stones, set by hand, in platinum and gold.",
          clip: `${ASSET_BASE}/leg4.mp4`,
          clipMobile: `${ASSET_BASE}/leg4-mobile.mp4`,
          cta: {
            primary: { href: "/watches", label: "Shop the collection" },
          },
          eyebrow: "Fine jewelry",
          id: "jewelry",
          label: "Fine jewelry",
          linger: 0.3,
          scroll: SECTION_SCROLL_WEIGHTS[3],
          still: `${ASSET_BASE}/scene4-desktop.webp`,
          stillMobile: `${ASSET_BASE}/scene4-mobile.webp`,
          title: "Nothing here is made twice",
        },
      ],
    });

    // scrub-engine.js's own layout() sizes the scroll track taller than our
    // last reachable landing point — it adds a full extra viewport height
    // "so the last flight completes" — which left real, scrollable space
    // past the jewelry ending (visible as slack on the browser's own
    // scrollbar, and reachable by anything not covered by the jump/clamp
    // handlers below, e.g. dragging the scrollbar thumb directly). Override
    // the track's height so the document's actual max scroll position is
    // exactly the jewelry landing point — nothing scrollable exists past
    // the final frame, period. Must re-apply after every resize, since the
    // engine's own resize handler (registered synchronously inside
    // mountScrollWorld, above, so it always runs before this one) recomputes
    // and resets the track back to its own taller height each time.
    //
    // Also re-snaps scrollY to the current section's exact landing position
    // in the *new* vh — every landing position and segment boundary is a
    // fraction of window.innerHeight (see sectionPositions), so resizing the
    // window (dragging its edge, or toggling fullscreen/maximize on
    // Windows) changes every one of those pixel boundaries out from under
    // the page's actual, unchanged scrollY. The engine's own resize handler
    // recomputes segment start/end against the new vh but never touches
    // scrollY, so the old absolute pixel position — tuned for the old vh —
    // instantly falls at some other, wrong fraction of the new layout. That
    // mismatch is the "scene goes crazy" glitch: without this, a resize can
    // land you mid-flight through a totally different scene than the one
    // you were actually looking at. Skipped while a jump animation is
    // in flight so it doesn't fight that animation's own scrollTo calls.
    // Coarse-pointer devices fire `resize` when the mobile URL bar slides
    // in/out on ordinary scroll — a height-only change, no real layout
    // change. Mirrors scrub-engine.js's own onResize guard (coarse &&
    // width unchanged → skip) so that doesn't re-snap scrollY and visibly
    // yank the user's position on every scroll; only a genuine width
    // change (an actual resize, or rotation) re-applies.
    const coarse = window.matchMedia(
      "(hover: none) and (pointer: coarse)",
    ).matches;
    let laidOutWidth = window.innerWidth;

    function applyResize() {
      laidOutWidth = window.innerWidth;
      const vh = window.innerHeight;
      const track =
        containerRef.current?.querySelector<HTMLElement>(".sw-track");
      if (track) {
        const maxLanding = sectionPositions(vh)[SECTION_COUNT - 1];
        track.style.height = `${maxLanding + vh}px`;
      }
      if (!isJumpingRef.current) {
        window.scrollTo(0, sectionPositions(vh)[currentIndexRef.current]);
      }
    }

    function handleResize() {
      if (coarse && window.innerWidth === laidOutWidth) return;
      applyResize();
    }

    applyResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [engineReady]);

  // One wheel/swipe/key gesture = one jump to the next or previous scene —
  // never a continuous, many-ticks-per-scene scrub. Uses a manual
  // rAF-driven scroll animation (not native scrollTo smooth-behavior) for
  // consistent, reliable motion.
  useEffect(() => {
    function animateScrollTo(targetY: number) {
      isJumpingRef.current = true;
      const startY = window.scrollY;
      const distance = targetY - startY;
      const vh = window.innerHeight;
      const durationMs = Math.min(
        MAX_JUMP_DURATION_MS,
        Math.max(MIN_JUMP_DURATION_MS, (Math.abs(distance) / vh) * MS_PER_VH),
      );
      const startTime = performance.now();
      const targetIndex = currentIndexRef.current;

      function step(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          isJumpingRef.current = false;
          // Reveal the instant we've landed — no added delay (see
          // TABLE_FADE_IN_MS above for why).
          if (targetIndex === TABLE_SECTION_INDEX) {
            setIsTableSettled(true);
          }
        }
      }

      requestAnimationFrame(step);
    }

    function jumpTo(index: number) {
      const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, index));
      currentIndexRef.current = clamped;
      // Hide right away, at the start of every jump (including one that's
      // headed back to the table) — the pieces should never be visible
      // while the camera is mid-flight, only once landed.
      setIsTableSettled(false);
      animateScrollTo(sectionPositions(window.innerHeight)[clamped]);
    }

    // Land on section 0's real keyframe immediately — the page must never
    // show the raw y=0 top-of-track state, that's the floor from the start.
    window.scrollTo(0, sectionPositions(window.innerHeight)[0]);

    // scrub-engine.js's own route dots (.sw-route__dot, the side buttons) ship
    // a built-in click handler that jumps to the MIDPOINT of a section's
    // scroll range — that lands mid-motion, not on the section's tuned
    // landing frame (see SECTION_LANDING_FRACTIONS above). We can't remove
    // the engine's own listener directly (it's a closure inside the vendored
    // script), so we intercept the click during the capture phase, stop it
    // from ever reaching the dot, and redirect to our own exact-frame jumpTo.
    // The same interception redirects the header's KRS logo (the header is a
    // sibling, not part of the engine's container) back to section 0 instead
    // of navigating away from this preview.
    function handleGlobalClickCapture(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const dot = target?.closest?.(".sw-route__dot");
      if (dot && containerRef.current?.contains(dot)) {
        e.preventDefault();
        e.stopPropagation();
        const route = dot.parentElement;
        const index = route ? Array.from(route.children).indexOf(dot) : -1;
        if (index >= 0 && !isJumpingRef.current) jumpTo(index);
        return;
      }

      const brandLink = target?.closest?.('header a[href="/"]');
      if (brandLink) {
        e.preventDefault();
        e.stopPropagation();
        if (!isJumpingRef.current) jumpTo(0);
      }
    }
    window.addEventListener("click", handleGlobalClickCapture, true);

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      if (isJumpingRef.current) return;
      // Section 0 is the floor — scrolling further "up" from it is a no-op,
      // never reveals anything above its landing point.
      if (currentIndexRef.current === 0 && e.deltaY < 0) return;
      if (Math.abs(e.deltaY) < WHEEL_TRIGGER_THRESHOLD) return;
      jumpTo(currentIndexRef.current + (e.deltaY > 0 ? 1 : -1));
    }

    function handleKeydown(e: KeyboardEvent) {
      if (isJumpingRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        jumpTo(currentIndexRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        jumpTo(currentIndexRef.current - 1);
      }
    }

    let touchStartY = 0;
    function handleTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0]?.clientY ?? 0;
    }
    // Unlike wheel (which already preventDefaults every tick), touch never
    // blocked the browser's own native scroll — only touchend reacted, after
    // the fact. That let a real swipe's native momentum carry the page past
    // our clamped landing points (in either direction) before the jump
    // logic ever ran, briefly exposing raw, un-snapped track: the engine's
    // "+1vh so the last flight completes" buffer past jewelry (bare
    // background + drifting sw-particles, nothing snapped there — the
    // "broken bubbles" past the end), or the equivalent dead space above
    // section 0. preventDefault here blocks that native scroll outright, so
    // touch behaves like wheel: input only ever triggers a jumpTo, never a
    // free scroll.
    function handleTouchMove(e: TouchEvent) {
      e.preventDefault();
    }
    function handleTouchEnd(e: TouchEvent) {
      if (isJumpingRef.current) return;
      const endY = e.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      if (Math.abs(delta) < TOUCH_TRIGGER_THRESHOLD_PX) return;
      jumpTo(currentIndexRef.current + (delta > 0 ? 1 : -1));
    }

    // Belt-and-suspenders catch-all: anything that can move scrollY without
    // going through jumpTo — the End/Home keys, dragging the native
    // scrollbar thumb, browser find-in-page autoscroll — bypasses the
    // wheel/keydown/touch handlers above entirely. Whenever a real scroll
    // lands outside the valid [first, last] landing range and we're not
    // mid-jump ourselves, snap it back immediately rather than leaving the
    // user parked in that un-snapped dead zone.
    function handleScrollBoundary() {
      if (isJumpingRef.current) return;
      const vh = window.innerHeight;
      const min = sectionPositions(vh)[0];
      const max = sectionPositions(vh)[SECTION_COUNT - 1];
      if (window.scrollY < min) {
        window.scrollTo(0, min);
      } else if (window.scrollY > max) {
        window.scrollTo(0, max);
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("scroll", handleScrollBoundary, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("scroll", handleScrollBoundary);
      window.removeEventListener("click", handleGlobalClickCapture, true);
    };
  }, []);

  return (
    <>
      <Script
        onLoad={() => setEngineReady(true)}
        src={`${ASSET_BASE}/scrub-engine.js`}
        strategy="afterInteractive"
      />
      {/* Unlayered override — scrub-engine.js wraps its own defaults in
          `@layer sw` specifically so unlayered rules always win regardless
          of injection order (see the engine's own header comment).
          - `.sw-copy__num` — hide the "01 / 04" counter.
          - `html, body { overflow-x: visible }` — the engine defensively sets
            overflow-x: hidden on both (every scene layer is position:fixed,
            so there's nothing that actually needs clipping). That rule is a
            known trigger for breaking `position: sticky` on ancestors in
            Chromium/Firefox, which is exactly what sits under it here: the
            real site Header (rendered as a sibling above this container)
            uses sticky positioning and was silently losing it.
          - `.sw-topbar` — the engine always mounts this fixed, full-width bar
            (z-index 50, above the Header's z-40) even though this config
            passes no brand/nav/cta into it, so it renders empty but still
            intercepts pointer events over the real Header's top band. */}
      <style>{`
        .sw-copy__num { display: none; }
        html, body { overflow-x: visible; }
        .sw-topbar { pointer-events: none; }
        /* Table section title way more down: override centered copy */
        .sw-copylayer .sw-copy:nth-child(2) {
          top: auto !important;
          bottom: clamp(24px, 6vh, 56px) !important;
          transform: none !important;
        }
        /* Hide the side route dots on mobile entirely (not just shrink them,
           which is all the engine's own mobile media query does) — same
           860px breakpoint the engine itself uses for its mobile styles. */
        @media (max-width: 860px) {
          .sw-route { display: none; }
        }
      `}</style>
      <div
        className={className}
        ref={containerRef}
        style={
          {
            "--sw-accent": "#c8a97e",
            "--sw-bg": "#0d0d0d",
            "--sw-font-body": "var(--font-sans)",
            "--sw-font-display": "var(--font-display)",
            "--sw-ink": "#f5f2eb",
            "--sw-ink-soft": "rgba(200,169,126,0.7)",
          } as React.CSSProperties
        }
      />

      {tableCutouts.length > 0 && (
        <>
        <div
          className={`
            fixed inset-0 z-[45] hidden
            md:block
          `}
          style={{
            opacity: isTableSettled ? 1 : 0,
            pointerEvents: isTableSettled ? "auto" : "none",
            transition: `opacity ${isTableSettled ? TABLE_FADE_IN_MS : TABLE_FADE_OUT_MS}ms ease`,
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
                className="group absolute hover:z-10"
                href={`/products/${product.id}`}
                key={product.id}
                style={{
                  left: `${centerX}%`,
                  top: `${centerY}%`,
                  width: `${widthPct}%`,
                  // Position by CENTER: the anchor's box is exactly the
                  // image's box (the img below is block w-full and the
                  // labels are out of flow), so this translation puts the
                  // IMAGE's center precisely on the slot point — all six
                  // watches share their row's horizontal axis through
                  // their centers no matter each image's natural size or
                  // aspect ratio.
                  transform: "translate(-50%, -50%)",
                }}
              >
                {isTopRow && (
                  <p
                    className={`
                      absolute bottom-full left-1/2 z-10 mb-1.5 max-w-[220%]
                      -translate-x-1/2 whitespace-normal break-words rounded
                      bg-black/60 px-2 py-0.5 text-center font-display text-xs
                      leading-tight text-krs-ivory opacity-0 backdrop-blur-sm
                      transition-opacity duration-200 group-hover:opacity-100
                      group-hover:text-krs-champagne-light
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
                      absolute left-1/2 top-full z-10 mt-1.5 max-w-[220%]
                      -translate-x-1/2 whitespace-normal break-words rounded
                      bg-black/60 px-2 py-0.5 text-center font-display text-xs
                      leading-tight text-krs-ivory opacity-0 backdrop-blur-sm
                      transition-opacity duration-200 group-hover:opacity-100
                      group-hover:text-krs-champagne-light
                    `}
                  >
                    {product.name}
                  </p>
                )}
              </a>
            );
          })}
        </div>

        {/* Mobile: a 3-per-row grid (wraps to a second line of 3 at 6 items)
            vertically centered in the viewport — the tray sits mid-frame in
            the mobile portrait crop, so centering (rather than anchoring
            near the header) is what actually reads as "sitting on the
            table" instead of a strip stuck up near the nav. Independent of
            the video's internal composition otherwise — TABLE_CUTOUT_SLOTS'
            percentage anchors are tuned against the desktop tray shot's crop
            and don't apply to the mobile crop (see the note on
            TABLE_CUTOUT_SLOTS above), so this doesn't try to reuse them.
            Same reveal/fade timing and "only tappable once landed" gating
            as the desktop overlay. */}
        <div
          className={`
            fixed inset-x-0 top-1/2 z-[45] px-5
            md:hidden
          `}
          style={{
            opacity: isTableSettled ? 1 : 0,
            pointerEvents: isTableSettled ? "auto" : "none",
            transform: "translateY(-50%)",
            transition: `opacity ${isTableSettled ? TABLE_FADE_IN_MS : TABLE_FADE_OUT_MS}ms ease`,
          }}
        >
          <div className="grid grid-cols-3 gap-x-3 gap-y-8">
            {tableCutouts.map((product) => (
              <a
                className="flex flex-col items-center"
                href={`/products/${product.id}`}
                key={product.id}
              >
                {/* Fixed height (not a square background box) — every cutout
                    has its own natural aspect ratio, so pinning height (and
                    letting width follow) is what makes all three per row
                    line up on the same baseline, no background needed. */}
                <img
                  alt={product.name}
                  className={`
                    h-28 w-auto
                    drop-shadow-[0_6px_12px_rgba(0,0,0,0.55)]
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
    </>
  );
}

// Gentle at both ends, cruising through the middle — a real camera dolly
// doesn't teleport into full speed the instant it starts moving. An
// aggressive ease-out (5th-power) was tried here and reverted: it front-
// loads ~40% of a jump's *distance* into its first ~10% of *time*, which
// blitzes through whatever footage sits early in that jump (the table→watch
// connector clip, being short and positioned early in that jump's distance,
// got scrubbed through in well under 150ms — a ~19x real-time blast). Cubic
// ease-in-out has zero velocity at both endpoints, so nothing gets crushed
// into an instant, and it still decelerates into the landing frame.
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
}

/**
 * Inverts CSS `object-fit: cover` + `object-position` to map a point/size
 * expressed as a fraction of the video's OWN frame onto a percentage
 * position within the viewport it renders into. This is what keeps an
 * overlay anchored to a specific spot in the footage (the tray) glued to
 * that spot regardless of the viewport's size or aspect ratio, instead of
 * drifting the way a flat viewport-percentage anchor does whenever the
 * cover crop changes.
 *
 * The returned centerX/centerY are the projected CENTER point of the
 * slot — the caller centers each cutout image on exactly that point
 * (translate(-50%, -50%)), which is what makes every watch in a row share
 * one horizontal axis through its image center regardless of its natural
 * size or aspect ratio.
 */
function mapCutoutSlot(
  slot: { wFrac: number; xFrac: number; yFrac: number },
  viewportWidth: number,
  viewportHeight: number,
): { centerX: number; centerY: number; widthPct: number } {
  const videoAspect = TABLE_VIDEO_WIDTH / TABLE_VIDEO_HEIGHT;
  const viewportAspect = viewportWidth / viewportHeight;
  // cover scales the video up until it fully fills the viewport on
  // whichever axis would otherwise leave a gap — i.e. by the LARGER of the
  // two possible scale factors.
  const scale =
    viewportAspect > videoAspect
      ? viewportWidth / TABLE_VIDEO_WIDTH
      : viewportHeight / TABLE_VIDEO_HEIGHT;
  const renderedWidth = TABLE_VIDEO_WIDTH * scale;
  const renderedHeight = TABLE_VIDEO_HEIGHT * scale;
  // Per the CSS object-position spec: the rendered content's offset is
  // (containerSize - renderedSize) * position fraction — negative here
  // since renderedSize > containerSize whenever that axis is cropped.
  const offsetX = (viewportWidth - renderedWidth) * TABLE_VIDEO_OBJECT_POSITION_X;
  const offsetY = (viewportHeight - renderedHeight) * TABLE_VIDEO_OBJECT_POSITION_Y;

  return {
    centerX: ((offsetX + slot.xFrac * renderedWidth) / viewportWidth) * 100,
    centerY: ((offsetY + slot.yFrac * renderedHeight) / viewportHeight) * 100,
    widthPct: ((slot.wFrac * renderedWidth) / viewportWidth) * 100,
  };
}

function sectionPositions(vh: number): number[] {
  let offset = 0;
  return SECTION_SCROLL_WEIGHTS.map((w, i) => {
    const landing = (offset + w * SECTION_LANDING_FRACTIONS[i]) * vh;
    offset += w;
    // Mirrors the engine's own segment layout (layout() in scrub-engine.js),
    // which inserts the table→watch connector's scroll distance here too.
    if (i === TABLE_SECTION_INDEX) offset += CONNECTOR_SCROLL_WEIGHT;
    return landing;
  });
}
