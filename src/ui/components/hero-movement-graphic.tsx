"use client";

import type { MotionValue } from "framer-motion";

import { motion, useTransform } from "framer-motion";

interface GearDef {
  cx: number;
  cy: number;
  r: number;
  spinDir: -1 | 1;
  spinSeconds: number;
  teeth: number;
}

interface HeroMovementGraphicProps {
  balanceEntry: MotionValue<number>;
  cageEntry: MotionValue<number>;
  className?: string;
  gearEntries: MotionValue<number>[];
  loupeReveal: MotionValue<number>;
  loupeX: MotionValue<number>;
  loupeY: MotionValue<number>;
  motionEnabled: boolean;
  springEntry: MotionValue<number>;
}

const VIEW_W = 900;
const VIEW_H = 800;
const CHAMPAGNE = "var(--krs-champagne)";

/** A filled cog silhouette — trapezoidal teeth with a flat tip and a flat root land, not a hairline circle. */
function buildGearPath(cx: number, cy: number, teeth: number, outerR: number, rootR: number): string {
  const step = 360 / teeth;
  const pts: [number, number][] = [];
  for (let i = 0; i < teeth; i++) {
    const base = i * step;
    pts.push(polar(cx, cy, rootR, base));
    pts.push(polar(cx, cy, outerR, base + step * 0.24));
    pts.push(polar(cx, cy, outerR, base + step * 0.5));
    pts.push(polar(cx, cy, rootR, base + step * 0.74));
  }
  return `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" L")} Z`;
}

function buildSpiralPath(
  cx: number,
  cy: number,
  turns: number,
  startR: number,
  endR: number,
  steps = 120,
): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const radius = startR + (endR - startR) * t;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.join(" ");
}

function meshAt(
  from: { cx: number; cy: number; r: number },
  spec: { r: number; teeth: number },
  deg: number,
  overlap = 6,
): { cx: number; cy: number; r: number; teeth: number } {
  const dist = from.r + spec.r - overlap;
  const [cx, cy] = polar(from.cx, from.cy, dist, deg);
  return { cx, cy, r: spec.r, teeth: spec.teeth };
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = toRad(deg);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// -- Going train: each wheel meshes with the previous one, guaranteed by
// construction (meshAt places it at outerR sum minus a fixed tooth overlap),
// so the geometry can't drift out of mesh no matter what angle is chosen.
const G1_BASE = { cx: 220, cy: 560, r: 145, teeth: 46 };
const G2_BASE = meshAt(G1_BASE, { r: 90, teeth: 30 }, -25);
const G3_BASE = meshAt(G2_BASE, { r: 54, teeth: 18 }, -10);
const PINION_BASE = meshAt(G3_BASE, { r: 24, teeth: 12 }, -15);
const PINION_DEG = -15;

const SPIN_BASE_SECONDS = 22;
function spinFor(teeth: number): number {
  return (SPIN_BASE_SECONDS * teeth) / G1_BASE.teeth;
}

const GEAR_DEFS: GearDef[] = [
  { ...G1_BASE, spinDir: 1, spinSeconds: spinFor(G1_BASE.teeth) },
  { ...G2_BASE, spinDir: -1, spinSeconds: spinFor(G2_BASE.teeth) },
  { ...G3_BASE, spinDir: 1, spinSeconds: spinFor(G3_BASE.teeth) },
  { ...PINION_BASE, spinDir: -1, spinSeconds: spinFor(PINION_BASE.teeth) },
];

// The tourbillon cage's pinion (the going train's last wheel) rides the
// cage rim facing back toward the train — so the cage sits further out
// along the exact same ray used to mesh the pinion in the first place.
export const RIM_R = 150;
const [CAGE_X, CAGE_Y] = polar(PINION_BASE.cx, PINION_BASE.cy, RIM_R, PINION_DEG);
export { CAGE_X, CAGE_Y };

const BALANCE_R = 44;
const LOUPE_R = 150;
const ARM_ANGLES = [96, 238];
const ARM_POINTS = ARM_ANGLES.map((deg) => polar(CAGE_X, CAGE_Y, RIM_R, deg));
const RIM_TICKS = Array.from({ length: 12 }, (_, i) => i * 30);
const HAIRSPRING_PATH = buildSpiralPath(CAGE_X, CAGE_Y, 2.5, 6, 30);
const SPRING = { cx: 120, cy: 690, endR: 62, startR: 12, turns: 4.5 };
const SPRING_PATH = buildSpiralPath(SPRING.cx, SPRING.cy, SPRING.turns, SPRING.startR, SPRING.endR);
const LOUPE_DETAIL_POINTS = Array.from({ length: 48 }, (_, i) => {
  const deg = (360 / 48) * i;
  return polar(CAGE_X, CAGE_Y, RIM_R - 22 + (i % 3) * 4, deg);
});

/**
 * The hero mechanism: a real going train (four meshing, individually
 * spinning gear wheels — filled cog silhouettes, not hairline circles)
 * feeding into a flying tourbillon cage with a nested balance wheel. Every
 * piece is invisible until the caller's entry progress values move past 0 —
 * nothing is drawn on load; the scene only exists once the user scrolls,
 * and assembles itself piece by piece as they do.
 */
export function HeroMovementGraphic({
  balanceEntry,
  cageEntry,
  className,
  gearEntries,
  loupeReveal,
  loupeX,
  loupeY,
  motionEnabled,
  springEntry,
}: HeroMovementGraphicProps) {
  const springOpacity = useTransform(springEntry, [0, 1], [0, 1]);
  const springDraw = useTransform(springEntry, [0, 1], [0, 1]);

  return (
    <svg
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
    >
      <defs>
        <linearGradient id="krsMetal" x1="15%" x2="85%" y1="10%" y2="90%">
          <stop offset="0%" stopColor="var(--krs-champagne-light)" />
          <stop offset="45%" stopColor={CHAMPAGNE} />
          <stop offset="100%" stopColor="var(--krs-tobacco)" />
        </linearGradient>
        <radialGradient id="krsJewelGradient">
          <stop offset="0%" stopColor="var(--krs-champagne-light)" />
          <stop offset="70%" stopColor={CHAMPAGNE} />
          <stop offset="100%" stopColor={CHAMPAGNE} stopOpacity={0.2} />
        </radialGradient>
        <clipPath id="krsLoupeClip">
          <motion.circle cx={0} cy={0} r={LOUPE_R} style={{ x: loupeX, y: loupeY }} />
        </clipPath>
      </defs>

      <circle
        cx={CAGE_X}
        cy={CAGE_Y}
        fill="none"
        r={RIM_R + 60}
        stroke={CHAMPAGNE}
        strokeOpacity={0.05}
        strokeWidth={1}
      />

      <motion.g style={{ opacity: springOpacity }}>
        <circle
          cx={SPRING.cx}
          cy={SPRING.cy}
          fill="none"
          r={SPRING.endR + 8}
          stroke={CHAMPAGNE}
          strokeOpacity={0.15}
          strokeWidth={1}
        />
        <motion.path
          d={SPRING_PATH}
          fill="none"
          stroke={CHAMPAGNE}
          strokeOpacity={0.25}
          strokeWidth={1}
          style={{ pathLength: springDraw }}
        />
      </motion.g>

      {GEAR_DEFS.map((def, i) => (
        <GearWheel def={def} entry={gearEntries[i]} key={i} motionEnabled={motionEnabled} />
      ))}

      <TourbillonCage balanceEntry={balanceEntry} cageEntry={cageEntry} motionEnabled={motionEnabled} />

      <motion.g clipPath="url(#krsLoupeClip)" style={{ opacity: loupeReveal }}>
        <circle
          cx={CAGE_X}
          cy={CAGE_Y}
          fill="none"
          r={RIM_R}
          stroke={CHAMPAGNE}
          strokeOpacity={0.85}
          strokeWidth={1.5}
        />
        {RIM_TICKS.map((deg) => {
          const [x1, y1] = polar(CAGE_X, CAGE_Y, RIM_R - 14, deg);
          const [x2, y2] = polar(CAGE_X, CAGE_Y, RIM_R, deg);
          return (
            <line
              key={deg}
              stroke={CHAMPAGNE}
              strokeOpacity={0.6}
              strokeWidth={1.25}
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          );
        })}
        {LOUPE_DETAIL_POINTS.map(([x, y], i) => (
          <circle cx={x} cy={y} fill={CHAMPAGNE} fillOpacity={0.4} key={i} r={0.8} />
        ))}
      </motion.g>
      <motion.circle
        cx={0}
        cy={0}
        fill="none"
        r={LOUPE_R}
        stroke="var(--krs-loupe-ring)"
        strokeOpacity={0.55}
        strokeWidth={1}
        style={{
          filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.45))",
          opacity: loupeReveal,
          x: loupeX,
          y: loupeY,
        }}
      />
    </svg>
  );
}

function GearWheel({
  def,
  entry,
  motionEnabled,
}: {
  def: GearDef;
  entry: MotionValue<number>;
  motionEnabled: boolean;
}) {
  const opacity = useTransform(entry, [0, 1], [0, 1]);
  const scale = useTransform(entry, [0, 1], [0.72, 1]);
  const rotate = useTransform(entry, [0, 1], [-16, 0]);
  const { cx, cy, r, spinDir, spinSeconds, teeth } = def;
  const rootR = r * 0.86;
  const boreR = r * 0.16;
  const spokeInnerR = r * 0.3;
  const spokeOuterR = rootR * 0.9;

  return (
    <motion.g
      style={{
        opacity,
        rotate,
        scale,
        transformBox: "view-box",
        transformOrigin: `${cx}px ${cy}px`,
      }}
    >
      <motion.g
        animate={motionEnabled ? { rotate: spinDir * 360 } : undefined}
        style={{ transformBox: "view-box", transformOrigin: `${cx}px ${cy}px` }}
        transition={
          motionEnabled ? { duration: spinSeconds, ease: "linear", repeat: Infinity } : undefined
        }
      >
        <path
          d={buildGearPath(cx, cy, teeth, r, rootR)}
          fill="url(#krsMetal)"
          stroke="var(--krs-mocha)"
          strokeOpacity={0.55}
          strokeWidth={0.75}
          style={{ filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.4))" }}
        />
        <circle
          cx={cx}
          cy={cy}
          fill="none"
          r={rootR * 0.66}
          stroke="var(--krs-onyx)"
          strokeOpacity={0.3}
          strokeWidth={1}
        />
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const [x1, y1] = polar(cx, cy, spokeInnerR, deg);
          const [x2, y2] = polar(cx, cy, spokeOuterR, deg);
          return (
            <line
              key={deg}
              stroke="var(--krs-onyx)"
              strokeOpacity={0.35}
              strokeWidth={Math.max(1, r * 0.045)}
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          );
        })}
        <circle cx={cx} cy={cy} fill="var(--krs-onyx)" r={boreR} />
        <circle
          cx={cx}
          cy={cy}
          fill="none"
          r={boreR}
          stroke={CHAMPAGNE}
          strokeOpacity={0.65}
          strokeWidth={1}
        />
      </motion.g>
    </motion.g>
  );
}

function TourbillonCage({
  balanceEntry,
  cageEntry,
  motionEnabled,
}: {
  balanceEntry: MotionValue<number>;
  cageEntry: MotionValue<number>;
  motionEnabled: boolean;
}) {
  const opacity = useTransform(cageEntry, [0, 1], [0, 1]);
  const scale = useTransform(cageEntry, [0, 1], [0.7, 1]);
  const rotate = useTransform(cageEntry, [0, 1], [-20, 0]);
  const balanceOpacity = useTransform(balanceEntry, [0, 1], [0, 1]);
  const balanceScale = useTransform(balanceEntry, [0, 1], [0.6, 1]);

  return (
    <motion.g
      style={{
        opacity,
        rotate,
        scale,
        transformBox: "view-box",
        transformOrigin: `${CAGE_X}px ${CAGE_Y}px`,
      }}
    >
      <motion.g
        animate={motionEnabled ? { rotate: 360 } : undefined}
        style={{ transformBox: "view-box", transformOrigin: `${CAGE_X}px ${CAGE_Y}px` }}
        transition={motionEnabled ? { duration: 10, ease: "linear", repeat: Infinity } : undefined}
      >
        <circle
          cx={CAGE_X}
          cy={CAGE_Y}
          fill="none"
          r={RIM_R}
          stroke={CHAMPAGNE}
          strokeOpacity={0.42}
          strokeWidth={1.5}
        />
        {RIM_TICKS.map((deg) => {
          const [x1, y1] = polar(CAGE_X, CAGE_Y, RIM_R - 10, deg);
          const [x2, y2] = polar(CAGE_X, CAGE_Y, RIM_R, deg);
          return (
            <line
              key={deg}
              stroke={CHAMPAGNE}
              strokeOpacity={0.25}
              strokeWidth={1}
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          );
        })}
        {ARM_POINTS.map(([x, y], i) => (
          <line
            key={i}
            stroke={CHAMPAGNE}
            strokeLinecap="round"
            strokeOpacity={0.48}
            strokeWidth={3}
            x1={CAGE_X}
            x2={x}
            y1={CAGE_Y}
            y2={y}
          />
        ))}
        {ARM_POINTS.map(([x, y], i) => (
          <circle cx={x} cy={y} fill="url(#krsJewelGradient)" key={i} r={5.5} />
        ))}

        <motion.g
          animate={motionEnabled ? { rotate: [-18, 18, -18] } : undefined}
          style={{
            opacity: balanceOpacity,
            scale: balanceScale,
            transformBox: "view-box",
            transformOrigin: `${CAGE_X}px ${CAGE_Y}px`,
          }}
          transition={
            motionEnabled ? { duration: 1.2, ease: "easeInOut", repeat: Infinity } : undefined
          }
        >
          <circle
            cx={CAGE_X}
            cy={CAGE_Y}
            fill="none"
            r={BALANCE_R}
            stroke={CHAMPAGNE}
            strokeOpacity={0.55}
            strokeWidth={1.5}
          />
          {[0, 90, 180, 270].map((deg) => {
            const [x2, y2] = polar(CAGE_X, CAGE_Y, BALANCE_R * 0.62, deg);
            return (
              <line
                key={deg}
                stroke={CHAMPAGNE}
                strokeOpacity={0.35}
                strokeWidth={1}
                x1={CAGE_X}
                x2={x2}
                y1={CAGE_Y}
                y2={y2}
              />
            );
          })}
          <path
            d={HAIRSPRING_PATH}
            fill="none"
            stroke={CHAMPAGNE}
            strokeOpacity={0.35}
            strokeWidth={0.75}
          />
          <circle cx={CAGE_X} cy={CAGE_Y} fill="url(#krsJewelGradient)" r={4.5} />
        </motion.g>
      </motion.g>
    </motion.g>
  );
}
