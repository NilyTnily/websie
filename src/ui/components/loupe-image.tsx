"use client";

import Image from "next/image";
import * as React from "react";

import { cn } from "~/lib/cn";
import { BLUR_DATA_URL } from "~/lib/image-placeholder";

interface LoupeImageProps {
  alt: string;
  className?: string;
  imageClassName?: string;
  lensSize?: number;
  priority?: boolean;
  sizes?: string;
  src: string;
  vignette?: boolean;
  zoom?: number;
}

/**
 * A jeweler's loupe that follows the cursor over product photography,
 * magnifying dial texture and stone facets — the way you'd actually
 * inspect a piece in person. Pointer-only by design: on touch devices the
 * image is just an image, and `prefers-reduced-motion` hides the lens.
 */
export function LoupeImage({
  alt,
  className,
  imageClassName,
  lensSize = 190,
  priority,
  sizes,
  src,
  vignette = true,
  zoom = 2.5,
}: LoupeImageProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = React.useState(false);
  const [supportsHover, setSupportsHover] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [lens, setLens] = React.useState({ bgX: 0, bgY: 0, x: 0, y: 0 });

  React.useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    setSupportsHover(query.matches);
    const handleChange = (e: MediaQueryListEvent) =>
      setSupportsHover(e.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const percentX = (x / bounds.width) * 100;
    const percentY = (y / bounds.height) * 100;

    setLens({ bgX: percentX, bgY: percentY, x, y });
  };

  const showLens = isActive && supportsHover;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      <Image
        alt={alt}
        blurDataURL={BLUR_DATA_URL}
        className={cn(
          "object-cover opacity-0 transition-opacity duration-500",
          isLoaded && "opacity-100",
          imageClassName,
        )}
        fill
        onLoad={() => setIsLoaded(true)}
        placeholder="blur"
        priority={priority}
        sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
        src={src}
      />

      {vignette && <div aria-hidden="true" className="krs-photo-grade" />}

      {showLens && (
        <div
          aria-hidden="true"
          className="krs-loupe-lens"
          style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: `${lens.bgX}% ${lens.bgY}%`,
            backgroundSize: `${zoom * 100}% ${zoom * 100}%`,
            height: lensSize,
            left: lens.x - lensSize / 2,
            top: lens.y - lensSize / 2,
            width: lensSize,
          }}
        />
      )}
    </div>
  );
}
