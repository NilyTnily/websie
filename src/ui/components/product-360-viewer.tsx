"use client";

import Image from "next/image";
import * as React from "react";

import { cn } from "~/lib/cn";

const PX_PER_FRAME = 8;

interface Product360ViewerProps {
  alt: string;
  className?: string;
  frames: string[];
}

export function Product360Viewer({
  alt,
  className,
  frames,
}: Product360ViewerProps) {
  const [frameIndex, setFrameIndex] = React.useState(0);
  const [loadedCount, setLoadedCount] = React.useState(0);
  const dragState = React.useRef<null | { startIndex: number; startX: number }>(
    null,
  );

  React.useEffect(() => {
    setLoadedCount(0);
    let cancelled = false;
    for (const src of frames) {
      const img = new window.Image();
      const markLoaded = () => {
        if (!cancelled) setLoadedCount((n) => n + 1);
      };
      img.onload = markLoaded;
      img.onerror = markLoaded;
      img.src = src;
    }
    return () => {
      cancelled = true;
    };
  }, [frames]);

  const isLoaded = loadedCount >= frames.length;

  const stepTo = (index: number) => {
    const wrapped = ((index % frames.length) + frames.length) % frames.length;
    setFrameIndex(wrapped);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isLoaded) return;
    dragState.current = { startIndex: frameIndex, startX: e.clientX };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const deltaX = e.clientX - dragState.current.startX;
    const steps = Math.trunc(deltaX / PX_PER_FRAME);
    stepTo(dragState.current.startIndex + steps);
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") stepTo(frameIndex - 1);
    else if (e.key === "ArrowRight") stepTo(frameIndex + 1);
  };

  return (
    <div
      aria-label={`${alt} — drag or use arrow keys to rotate`}
      aria-valuemax={frames.length}
      aria-valuemin={1}
      aria-valuenow={frameIndex + 1}
      className={cn(
        "relative touch-none select-none",
        isLoaded ? `
          cursor-grab
          active:cursor-grabbing
        ` : "cursor-wait",
        className,
      )}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="slider"
      tabIndex={0}
    >
      <Image
        alt={`${alt} — 360° view, frame ${frameIndex + 1} of ${frames.length}`}
        className="pointer-events-none object-cover"
        draggable={false}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        src={frames[frameIndex] ?? frames[0]}
      />

      {!isLoaded && (
        <div
          className={`
            absolute inset-0 flex items-center justify-center bg-background/70
            text-xs text-muted-foreground
          `}
        >
          Loading 360° view… {loadedCount}/{frames.length}
        </div>
      )}

      {isLoaded && (
        <div
          className={`
            krs-ref absolute right-2 bottom-2 rounded bg-background/80 px-2 py-1
            text-[10px] text-muted-foreground
          `}
        >
          Drag to rotate
        </div>
      )}
    </div>
  );
}
