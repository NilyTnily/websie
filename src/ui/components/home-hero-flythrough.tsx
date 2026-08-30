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
// Scroll allotment (vh) for the leg2 connector clip inserted between
// section 1 and section 2 (see the `connectors` array passed to
// mountScrollWorld below) — must stay in sync with `connScroll` there for
// the same reason SECTION_SCROLL_WEIGHTS must match each section's own
// `scroll`: sectionPositions() below reimplements the engine's scroll-math
// independently, so every extra bit of scroll span the engine allocates has
// to be accounted for here too or our own jump targets land short/long.
const TABLE_WATCH_CONNECTOR_WIDTH = 1.4;
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
const TABLE_FADE_IN_MS = 96; // 120 * 0.8 — reveal 20% faster
// Leaving is intentionally quicker than arriving — once the camera starts
// pulling away from the tray the composited pieces should peel off right
// away, not linger over a scene that's already moving on.
const TABLE_FADE_OUT_MS = 260;
// Landing fractions for each section — fraction of THAT section's scroll range
// where the jump should land, which maps to the same fraction of the clip's
// duration. Read directly off the on-screen frame-counter HUD (bottom-left,
// dev-only): scroll to where each clip's camera visually settles, note the
// `fraction` line.
//
// 0 (storefront):         0       — leg1-final.mp4, land on the very first
//                                   frame (storefront exterior).
// 1 (the table / tray):   0.9869  — leg1-final.mp4, SAME clip as section 0
//                                   above — scrub-engine.js merges the two
//                                   into one continuous video instance (see
//                                   the section's own `clip` comment below),
//                                   so this is now safe: no double load, no
//                                   restart-from-0 on the 0→1 jump. Lands on
//                                   leg1's own tail, the wide straight-on
//                                   empty tray, per exact HUD reading.
// 2 (watch->jewelry):    0.12    — leg3-final.mp4, settles on the watch
//                                  close-up before the camera pulls back into
//                                  the jewelry-case glide later in the clip.
// 3 (jewelry hold):      0.9378  — leg4-final.mp4, per exact HUD reading
//                                  (scrollY 2244px, t 4.85s/5.17s).
const SECTION_LANDING_FRACTIONS = [0, 0.9869, 0.12, 0.9378];
// Jump duration scales with distance instead of being fixed — the three
// possible hops cover very different scroll distances (storefront→table
// ≈2.7vh, table→watch ≈1.48vh via the connector, watch→jewelry ≈2.18vh; see
// sectionPositions below), so a fixed wall-clock duration for all of them
// gave each a different average pace. Scaling by distance keeps every jump
// moving at the same vh-per-ms rate ended up reading as inconsistent pace
// instead — some hops span far more underlying video (a landing fraction
// near a clip's end pulls almost the entire next clip through the jump too)
// than others, so distance-based timing let short-video-content jumps feel
// snappy and long-video-content ones feel rushed even after clamping. Every
// jump now takes the exact same wall-clock time — that's what actually
// reads as "consistent pace" to a person watching it, not a derived rate.
const JUMP_DURATION_MS = 4180; // 3800 * 1.1 — all jumps slowed 10%
const WHEEL_TRIGGER_THRESHOLD = 12;
const TOUCH_TRIGGER_THRESHOLD_PX = 40;
// A real (non-trackpad) mouse wheel's notches arrive as separate hardware
// events spaced out over real time — a single quick flick of a free-spinning
// wheel can still be generating notches 300-600ms after the "gesture" felt
// like it ended. isJumpingRef alone only blocks input WHILE the 4.18s jump
// animation is in flight; a trailing notch that lands just after it flips
// back to false reads as a second, deliberate scroll and fires a second
// jump — which is exactly what turned "one little scroll" into landing two
// sections away. This grace window keeps ignoring wheel input for a beat
// after landing too, so residual notches from the same physical flick are
// absorbed instead of counted. Scoped to wheel only (see handleWheel) —
// keyboard and touch have no equivalent hardware queue behind them.
const WHEEL_COOLDOWN_MS = 550;

// The table scene's clip (leg1-final.mp4, shared with section 0) native resolution and CSS
// object-position (see .sw-scene__video in scrub-engine.js's injected CSS)
// — needed to invert object-fit: cover's crop math in mapCutoutSlot below,
// so the cutouts track the tray's actual position in the footage at ANY
// viewport size/aspect ratio instead of drifting off it. A flat
// viewport-percentage anchor only happens to look right at whichever one
// aspect ratio it was eyeballed against — cover crops differently at every
// other ratio, which is exactly what made cutouts sit further and further
// off the tray on very wide, very narrow, or very large screens.
// Matches leg2-final.mp4's actual encoded resolution (2K upscale, 7:4).
const TABLE_VIDEO_WIDTH = 2520;
const TABLE_VIDEO_HEIGHT = 1440;
const TABLE_VIDEO_OBJECT_POSITION_X = 0.5; // "center"
const TABLE_VIDEO_OBJECT_POSITION_Y = 0.42; // "42%"

// Anchors for the velvet display tray, expressed as fractions of the SOURCE
// VIDEO FRAME (0..1 on each axis) rather than the viewport — that's the
// coordinate system mapCutoutSlot projects onto the current viewport at
// render time.
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
// Layout: 2 rows × 3–4 per line = 7 total, zigzag along X axis.
// Bottom row has 4 watches (new + 3 lowers), top row has 3 uppers.
// Offset by ~half a watch spacing so no two watches ever share the
// same y axis and bracelets don't overlap. Even X spacing (~0.13)
// throughout, comfortable gaps. New watch sits bottom-most left.
const TABLE_CUTOUT_SLOTS = [
  // Row 1 — upper
  { wFrac: 0.08, xFrac: 0.350, yFrac: 0.360 },
  { wFrac: 0.08, xFrac: 0.478, yFrac: 0.360 },
  { wFrac: 0.08, xFrac: 0.606, yFrac: 0.360 },
  // Row 2 — lower (offset +0.065 on X for zigzag, 4 watches)
  { wFrac: 0.08, xFrac: 0.285, yFrac: 0.605 },
  { wFrac: 0.08, xFrac: 0.415, yFrac: 0.605 },
  { wFrac: 0.08, xFrac: 0.543, yFrac: 0.605 },
  { wFrac: 0.08, xFrac: 0.671, yFrac: 0.605 },
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
      // Off — the gradient/glow sits behind every scene at z-index 0 and is
      // fully hidden as long as the active scene is at opacity 1, but during
      // a crossfade the entering/leaving scene briefly dips below 1, letting
      // this accent-tinted gradient show through. Never asked for, only
      // capable of reading as an unwanted darken/tint during transitions —
      // off entirely removes that possibility.
      atmosphere: false,
      // Only one real connector: leg2, between section 1 and section 2.
      // Section 1 now lands on leg1's own tail (the tray) and section 2
      // starts fresh on leg3 (whose own opening frame is the single-watch
      // close-up — confirmed pixel-identical to leg2's OWN ending frame).
      // leg2 is the clip that actually bridges those two — tray at its
      // start, that same watch close-up at its end — so it plays as a
      // genuine fly-through during the 1→2 jump instead of jump-cutting
      // from the tray straight to the watch. See TABLE_WATCH_CONNECTOR_WIDTH
      // below for how sectionPositions() accounts for its extra scroll span.
      // The other two seams still crossfade directly — section 0 and
      // section 3 don't have this same clip-reuse gap.
      connectors: [undefined, `${ASSET_BASE}/leg2-final.mp4`, undefined],
      connectorsMobile: [undefined, `${ASSET_BASE}/leg2-mobile.mp4`, undefined],
      connScroll: TABLE_WATCH_CONNECTOR_WIDTH,
      // Default seam dissolve is 0.12vh — barely any scroll distance, so it
      // reads as an abrupt pop rather than a blend. Widened so the dissolve
      // itself has room to feel like a cross-dissolve instead of a hard cut.
      crossfade: 0.45,
      hint: "scroll to step inside",
      nav: false,
      sections: [
        {
          accent: "#c8a97e",
          body: "A small house on a quiet street — every piece serviced in-house, every case fitted before it leaves the bench.",
          clip: `${ASSET_BASE}/leg1-final.mp4`,
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
          body: "Six pieces pulled from the case this week — hover a watch to see it, click to look closer.",
          // Reuses leg1 (same as section 0) — scrub-engine.js now detects
          // two adjacent sections sharing a clip and merges them into ONE
          // continuous video instance spanning both sections' combined
          // scroll range (see the `owner`/groupStart/groupEnd logic in
          // scrub-engine.js), instead of loading it twice and restarting
          // playback at this section's own start. That merge is what makes
          // it safe to point this at leg1's own tail frame directly.
          clip: `${ASSET_BASE}/leg1-final.mp4`,
          clipMobile: `${ASSET_BASE}/leg1-mobile.mp4`,
          // Tracks the landing fraction (same copyPeak-tracks-landing fix as
          // watch/jewelry below) so the title is fully opaque exactly when
          // the shot settles, instead of peaking at the scroll-progress
          // default of 0.5 and being mostly faded out by the time this
          // section (which lands near the very end of its own range) stops.
          copyPeak: SECTION_LANDING_FRACTIONS[1],
          cta: {
            primary: { href: "/watches", label: "View all watches" },
          },
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
          clip: `${ASSET_BASE}/leg3-final.mp4`,
          clipMobile: `${ASSET_BASE}/leg3-mobile.mp4`,
          // Without copyPeak, title opacity defaults to peaking at scroll
          // progress 0.5 — but this section lands at 0.89, so by the time
          // the camera settles the title had already faded to ~22%
          // opacity. Pinning peak to the landing fraction keeps it fully
          // opaque exactly when the shot arrives, same fix as the table
          // section's copyPeak above.
          copyPeak: SECTION_LANDING_FRACTIONS[2],
          cta: {
            primary: { href: "/watches", label: "Shop watches" },
          },
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
          clip: `${ASSET_BASE}/leg4-final.mp4`,
          clipMobile: `${ASSET_BASE}/leg4-mobile.mp4`,
          // Same copyPeak fix as watch above — this section lands at 0.916.
          copyPeak: SECTION_LANDING_FRACTIONS[3],
          cta: {
            primary: { href: "/jewelry", label: "Shop the collection" },
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
    // Wheel/key/touch input that arrives while a jump is already in flight
    // is simply ignored — one gesture, one jump. Queuing-and-replaying the
    // latest direction (a prior approach) let trackpad momentum, which can
    // keep firing wheel events for a second or more after the user's finger
    // lifts, chain into a second, third, even fourth jump back-to-back,
    // which is exactly what read as "one little scroll runs all the way to
    // the end." Dropping input during a jump is the deliberate tradeoff:
    // an extra wheel tick mid-animation is lost, but navigation is fully
    // discrete and predictable — the same physical gesture always produces
    // the same number of jumps.
    //
    // Route-dot / logo clicks are different: a click is a single discrete,
    // deliberate event, so instead of dropping it (wheel) or queuing it to
    // run only after the in-flight jump fully finishes (a prior approach —
    // that made a click during an active jump take up to 2x
    // JUMP_DURATION_MS to land, which read as "the table button doesn't
    // show watches" if you didn't wait the full ~8s out), a click always
    // RETARGETS immediately: cancel whatever jump is currently in flight and
    // start a fresh one from the current scroll position straight to the
    // clicked section. activeRafId tracks the in-flight step() loop so it
    // can actually be cancelled instead of leaving two loops fighting over
    // window.scrollTo.
    let activeRafId: null | number = null;
    // Timestamp (performance.now()) until which wheel input is ignored even
    // though isJumpingRef.current has already gone back to false — see
    // WHEEL_COOLDOWN_MS above.
    let wheelCooldownUntil = 0;

    function animateScrollTo(targetY: number) {
      if (activeRafId !== null) cancelAnimationFrame(activeRafId);
      isJumpingRef.current = true;
      const startY = window.scrollY;
      const distance = targetY - startY;
      const durationMs = JUMP_DURATION_MS;
      const startTime = performance.now();
      const targetIndex = currentIndexRef.current;

      function step(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));
        if (progress < 1) {
          activeRafId = requestAnimationFrame(step);
        } else {
          activeRafId = null;
          isJumpingRef.current = false;
          // See WHEEL_COOLDOWN_MS — absorbs trailing wheel notches from the
          // same physical flick instead of counting them as a new gesture.
          wheelCooldownUntil = performance.now() + WHEEL_COOLDOWN_MS;
          // Reveal the instant we've landed — no added delay (see
          // TABLE_FADE_IN_MS above for why).
          if (targetIndex === TABLE_SECTION_INDEX) {
            setIsTableSettled(true);
          }
        }
      }

      activeRafId = requestAnimationFrame(step);
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

    // Browsers restore the previous scrollY on reload/back-navigation by
    // default (history.scrollRestoration = "auto") — that fights our own
    // "always land on section 0 on mount" call below, since the browser's
    // restore can run after ours and silently override it, which is exactly
    // what was landing the page on whatever deep section was last scrolled
    // to in a prior session instead of the true start. Taking manual control
    // stops the browser from touching scrollY on its own.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    // Land on section 0's real keyframe immediately — the page must never
    // show the raw y=0 top-of-track state, that's the floor from the start.
    window.scrollTo(0, sectionPositions(window.innerHeight)[0]);

    // scrub-engine.js's own route dots (.sw-route__dot, the side buttons)
    // used to ship a built-in click handler that jumped to the MIDPOINT of a
    // section's scroll range — that landed mid-motion, not on the section's
    // tuned landing frame (see SECTION_LANDING_FRACTIONS above); that
    // internal handler has since been deleted from the vendored script
    // entirely (it was fully dead anyway, since this capture-phase
    // interceptor always got there first). We intercept the click during the
    // capture phase, stop it from ever reaching the dot, and redirect to our
    // own exact-frame jumpTo. The same interception redirects the header's
    // KRS logo (the header is a sibling, not part of the engine's container)
    // back to section 0 instead of navigating away from this preview.
    function handleGlobalClickCapture(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const dot = target?.closest?.(".sw-route__dot");
      if (dot && containerRef.current?.contains(dot)) {
        e.preventDefault();
        e.stopPropagation();
        const route = dot.parentElement;
        const index = route ? Array.from(route.children).indexOf(dot) : -1;
        if (index >= 0) {
          jumpTo(index);
        }
        return;
      }

      const brandLink = target?.closest?.('header a[href="/"]');
      if (brandLink) {
        e.preventDefault();
        e.stopPropagation();
        jumpTo(0);
      }
    }
    window.addEventListener("click", handleGlobalClickCapture, true);

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      // Section 0 is the floor — scrolling further "up" from it is a no-op,
      // never reveals anything above its landing point.
      if (currentIndexRef.current === 0 && e.deltaY < 0) return;
      if (Math.abs(e.deltaY) < WHEEL_TRIGGER_THRESHOLD) return;
      if (isJumpingRef.current) return;
      if (performance.now() < wheelCooldownUntil) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      jumpTo(currentIndexRef.current + dir);
    }

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        if (isJumpingRef.current) return;
        jumpTo(currentIndexRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        if (isJumpingRef.current) return;
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
      const endY = e.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      if (Math.abs(delta) < TOUCH_TRIGGER_THRESHOLD_PX) return;
      if (isJumpingRef.current) return;
      const dir = delta > 0 ? 1 : -1;
      jumpTo(currentIndexRef.current + dir);
    }

    // Hard lock: outside of our own animateScrollTo (isJumpingRef true),
    // scrollY must always sit exactly on the CURRENT section's landing
    // point — not just somewhere inside the overall [first, last] range.
    // The previous version only clamped to those two outer bounds, which
    // meant any scroll that reaches the page through a path our own
    // handlers don't fully own — iOS's native momentum/rubber-band
    // scrolling in particular, which keeps moving the page after the
    // finger lifts and after handleTouchMove's preventDefault has already
    // stopped receiving events for that gesture, since it's simulated by
    // WebKit itself rather than driven by further touch events — could
    // ride that momentum straight through every section in between and
    // land on the last one, reading as "one little scroll skipped straight
    // to the end." Snapping back to the exact current-section position on
    // every stray scroll (not just out-of-range ones) closes that gap:
    // the page now visibly refuses to move at all except through a
    // deliberate jumpTo. The one exception users can still trigger is
    // iOS's own "tap the status bar/clock to scroll to top" gesture — that
    // still results in an immediate snap-back to the current section here,
    // which is fine (nothing to disable; it just doesn't stick).
    function handleScrollBoundary() {
      if (isJumpingRef.current) return;
      const vh = window.innerHeight;
      const lockedY = sectionPositions(vh)[currentIndexRef.current];
      if (Math.abs(window.scrollY - lockedY) > 1) {
        window.scrollTo(0, lockedY);
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
        /* Bubbles: the engine always appends .sw-particles regardless of the
           atmosphere config flag (that flag only gates the gradient/glow
           layers) — hide it outright instead of patching the vendored
           script. */
        .sw-particles { display: none; }
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
        /* Table section on mobile only: the watch cutouts sit centered in
           the middle of the screen (see the mobile grid overlay below), and
           the eyebrow/title/body copy competes with them for the same
           vertical space — drop just that text (and the "01 / 04" counter)
           so the watches read clearly, keeping only each cutout's own name
           caption as the "subtext". The CTA button ("View all watches")
           stays visible — hiding the text above it shouldn't take the
           button with it. Desktop keeps the full copy block. */
        @media (max-width: 860px) {
          .sw-copylayer .sw-copy:nth-child(2) .sw-copy__num,
          .sw-copylayer .sw-copy:nth-child(2) .sw-copy__eyebrow,
          .sw-copylayer .sw-copy:nth-child(2) .sw-copy__title,
          .sw-copylayer .sw-copy:nth-child(2) .sw-copy__body {
            display: none !important;
          }
          /* Re-anchor what's left (just the CTA button) to sit centered,
             directly under the watch grid — that grid is vertically
             centered on the viewport (see the mobile cutout overlay's
             top-1/2 + translateY(-50%) below), so anchoring the button off
             the viewport's own center rather than the bottom edge is what
             keeps it reading as "attached to the watches" instead of
             stranded down by the scroll hint. */
          .sw-copylayer .sw-copy:nth-child(2) {
            left: 50% !important;
            right: auto !important;
            top: 50% !important;
            bottom: auto !important;
            width: auto !important;
            max-width: none !important;
            transform: translate(-50%, calc(148px + 10vh)) !important;
            text-align: center;
          }
          .sw-copylayer .sw-copy:nth-child(2) .sw-copy__cta {
            justify-content: center;
            margin-top: 0;
          }
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
            // NOT "auto" here — this wrapper is `fixed inset-0`, covering
            // the entire viewport including the real Header up top (which
            // sits at a lower z-index, z-40, than this z-45 layer). Setting
            // pointer-events on the wrapper itself made the whole viewport
            // hit-testable the instant a watch was visible, silently eating
            // every click on the header/logo/nav while landed on the table
            // section — that's the "header isn't clickable" bug. Each
            // cutout <a> below sets its own pointer-events instead, so only
            // the actual watch images (not the transparent space around
            // them, including the header strip) ever intercept a click.
            pointerEvents: "none",
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
                  // Position by CENTER: the anchor's box is exactly the
                  // image's box (the img below is block w-full and the
                  // labels are out of flow), so this translation puts the
                  // IMAGE's center precisely on the slot point — all six
                  // watches share their row's horizontal axis through
                  // their centers no matter each image's natural size or
                  // aspect ratio.
                  transform: "translate(-50%, -50%)",
                  width: `${widthPct}%`,
                }}
              >
                {isTopRow && (
                  <p
                    className={`
                      absolute bottom-full left-1/2 z-10 mb-1.5 max-w-[220%]
                      -translate-x-1/2 rounded bg-black/60 px-2 py-0.5
                      text-center font-display text-xs leading-tight break-words
                      whitespace-normal text-krs-ivory opacity-0
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
                      text-center font-display text-xs leading-tight break-words
                      whitespace-normal text-krs-ivory opacity-0
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
            // Same fix as the desktop overlay above — wrapper stays
            // pointer-events:none (it's fixed inset-x-0, spanning full
            // width including over the header), each <a> opts itself in.
            pointerEvents: "none",
            transform: "translateY(-50%)",
            transition: `opacity ${isTableSettled ? TABLE_FADE_IN_MS : TABLE_FADE_OUT_MS}ms ease`,
          }}
        >
          <div className="grid grid-cols-3 gap-x-3 gap-y-8">
            {/* Mobile stays capped at 6 (2 full rows of 3) — desktop's grid
                grew to 7 in a zigzag layout that has no clean mobile
                equivalent (a 7th item would either overflow to a lonely
                third row or force uneven columns), so mobile intentionally
                keeps the original 3x2 count instead of following desktop. */}
            {tableCutouts.slice(0, 6).map((product) => (
              <a
                className="flex flex-col items-center"
                href={`/products/${product.id}`}
                key={product.id}
                style={{ pointerEvents: isTableSettled ? "auto" : "none" }}
              >
                {/* Fixed height (not a square background box) — every cutout
                    has its own natural aspect ratio, so pinning height (and
                    letting width follow) is what makes all three per row
                    line up on the same baseline, no background needed. */}
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
  // Segment chain: dive0(1.4) → dive1(1.4) → [leg2 connector: 1.4] →
  // dive2(1.6) → dive3(1.6). The connector is real again (see `connectors`
  // in mountScrollWorld above) — it's what actually bridges section 1
  // landing on leg1's tray to section 2 starting on leg3's watch close-up.
  // Sections 0 and 3 still have no connector gap either side of them.
  let offset = 0;
  return SECTION_SCROLL_WEIGHTS.map((w, i) => {
    const landing = (offset + w * SECTION_LANDING_FRACTIONS[i]) * vh;
    offset += w;
    if (i === 1) offset += TABLE_WATCH_CONNECTOR_WIDTH;
    return landing;
  });
}
