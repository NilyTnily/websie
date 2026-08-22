"use client";

import {
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  CAGE_X,
  CAGE_Y,
  HeroMovementGraphic,
  RIM_R,
} from "~/ui/components/hero-movement-graphic";

interface HomeHeroScrollProps {
  className?: string;
}

const LOUPE_START_X = CAGE_X - RIM_R * 0.7;
const LOUPE_START_Y = CAGE_Y - RIM_R * 0.35;
const LOUPE_END_X = CAGE_X + RIM_R * 0.75;
const LOUPE_END_Y = CAGE_Y + RIM_R * 0.45;

// Nothing renders before scroll starts (the 0.04 dead zone below). From
// there the going train assembles piece by piece, then the tourbillon,
// then the loupe sweeps across it — one cascading build, not four
// independent systems firing at once.
const G1_RANGE: [number, number] = [0.04, 0.16];
const G2_RANGE: [number, number] = [0.1, 0.22];
const G3_RANGE: [number, number] = [0.16, 0.28];
const PINION_RANGE: [number, number] = [0.22, 0.34];
const SPRING_RANGE: [number, number] = [0.06, 0.2];
const CAGE_RANGE: [number, number] = [0.3, 0.46];
const BALANCE_RANGE: [number, number] = [0.38, 0.52];
const LOUPE_RANGE: [number, number] = [0.55, 0.88];
const LOUPE_HOLD_RANGE = [0.55, 0.65, 0.78, 0.88];

/**
 * Drives the hero's watch-mechanism graphic off scroll position. On mount,
 * and for as long as the user hasn't scrolled, every part of the graphic is
 * fully invisible — this is a scroll-triggered reveal, not a load-in
 * animation. Falls back to a fully static, fully-assembled composition (no
 * scroll-linked motion, no always-on rotation loops) on prefers-reduced-motion
 * and coarse-pointer devices.
 */
export function HomeHeroScroll({ className }: HomeHeroScrollProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [motionEnabled, setMotionEnabled] = useState(false);

  useEffect(() => {
    setMotionEnabled(
      !shouldReduceMotion && !window.matchMedia("(pointer: coarse)").matches,
    );
  }, [shouldReduceMotion]);

  const { scrollYProgress } = useScroll({
    offset: ["start start", "end start"],
    target: sectionRef,
  });

  const g1 = useTransform(scrollYProgress, G1_RANGE, [0, 1]);
  const g2 = useTransform(scrollYProgress, G2_RANGE, [0, 1]);
  const g3 = useTransform(scrollYProgress, G3_RANGE, [0, 1]);
  const pinion = useTransform(scrollYProgress, PINION_RANGE, [0, 1]);
  const spring = useTransform(scrollYProgress, SPRING_RANGE, [0, 1]);
  const cage = useTransform(scrollYProgress, CAGE_RANGE, [0, 1]);
  const balance = useTransform(scrollYProgress, BALANCE_RANGE, [0, 1]);
  const loupeReveal = useTransform(scrollYProgress, LOUPE_HOLD_RANGE, [0, 1, 1, 0]);
  const loupeX = useTransform(scrollYProgress, LOUPE_RANGE, [LOUPE_START_X, LOUPE_END_X]);
  const loupeY = useTransform(scrollYProgress, LOUPE_RANGE, [LOUPE_START_Y, LOUPE_END_Y]);

  const staticFull = useMotionValue(1);
  const staticZero = useMotionValue(0);
  const staticLoupeX = useMotionValue((LOUPE_START_X + LOUPE_END_X) / 2);
  const staticLoupeY = useMotionValue((LOUPE_START_Y + LOUPE_END_Y) / 2);

  const gearEntries = motionEnabled
    ? [g1, g2, g3, pinion]
    : [staticFull, staticFull, staticFull, staticFull];

  return (
    <div className={className} ref={sectionRef}>
      <HeroMovementGraphic
        balanceEntry={motionEnabled ? balance : staticFull}
        cageEntry={motionEnabled ? cage : staticFull}
        className="h-full w-full"
        gearEntries={gearEntries}
        loupeReveal={motionEnabled ? loupeReveal : staticZero}
        loupeX={motionEnabled ? loupeX : staticLoupeX}
        loupeY={motionEnabled ? loupeY : staticLoupeY}
        motionEnabled={motionEnabled}
        springEntry={motionEnabled ? spring : staticFull}
      />
    </div>
  );
}
