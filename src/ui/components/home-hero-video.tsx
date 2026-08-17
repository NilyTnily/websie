"use client";

import { useReducedMotion, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface HomeHeroVideoProps {
  className?: string;
  poster?: string;
  src: string;
}

/**
 * Scrubs the hero video's currentTime to scroll progress through the hero
 * section on desktop. Falls back to the plain autoplay/loop behavior on
 * reduced-motion and touch devices, where currentTime scrubbing is either
 * unwanted or unreliable.
 */
export function HomeHeroVideo({ className, poster, src }: HomeHeroVideoProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [scrubEnabled, setScrubEnabled] = useState(false);
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end start"],
    target: sectionRef,
  });

  useEffect(() => {
    const enabled =
      !shouldReduceMotion && !window.matchMedia("(pointer: coarse)").matches;
    console.log("[hero-video] effect1", { enabled, shouldReduceMotion });
    setScrubEnabled(enabled);
  }, [shouldReduceMotion]);

  useEffect(() => {
    console.log("[hero-video] effect2", {
      scrubEnabled,
      video: !!videoRef.current,
    });
    if (!scrubEnabled) return;
    const video = videoRef.current;
    if (!video) return;

    const unsubscribe = scrollYProgress.on("change", (progress) => {
      console.log("[hero-video] progress", progress, video.duration);
      if (!video.duration) return;
      video.currentTime = progress * video.duration;
    });
    console.log("[hero-video] subscribed");

    return unsubscribe;
  }, [scrollYProgress, scrubEnabled]);

  return (
    <div className={className} ref={sectionRef}>
      <video
        aria-label="Close-up of a Swiss mechanical watch movement, gears and jewels turning"
        autoPlay={!scrubEnabled}
        className="h-full w-full object-cover opacity-[.82]"
        loop={!scrubEnabled}
        muted
        playsInline
        poster={poster}
        preload="auto"
        ref={videoRef}
        src={src}
      />
    </div>
  );
}
