"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";

interface LoupeStatsProps {
  productCount: number;
}

/** The loupe band's stat row. "Pieces graded" counts up to the real productCount on scroll-into-view; the other two are fixed labels, not numbers. */
export function LoupeStats({ productCount }: LoupeStatsProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { margin: "-40px", once: true });
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (value) => Math.round(value).toString());

  useEffect(() => {
    if (!isInView) return;
    if (shouldReduceMotion) {
      count.set(productCount);
      return;
    }
    const controls = animate(count, productCount, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [count, isInView, productCount, shouldReduceMotion]);

  return (
    <div className="mt-8 grid grid-cols-3 gap-px bg-krs-champagne/25">
      <div className="bg-krs-onyx px-4 py-6">
        <p className="font-display text-2xl text-krs-champagne">10×</p>
        <p className="krs-meta mt-2 text-krs-ivory/50">Magnification</p>
      </div>
      <div className="bg-krs-onyx px-4 py-6">
        <motion.p
          className="font-display text-2xl text-krs-champagne"
          ref={ref}
        >
          {rounded}
        </motion.p>
        <p className="krs-meta mt-2 text-krs-ivory/50">Pieces graded</p>
      </div>
      <div className="bg-krs-onyx px-4 py-6">
        <p className="font-display text-2xl text-krs-champagne">In-house</p>
        <p className="krs-meta mt-2 text-krs-ivory/50">Every service</p>
      </div>
    </div>
  );
}
