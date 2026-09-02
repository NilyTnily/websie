"use client";

import Image from "next/image";
import * as React from "react";

import { cn } from "~/lib/cn";
import { BLUR_DATA_URL } from "~/lib/image-placeholder";
import { ImageFallback } from "~/ui/components/image-fallback";

interface LoupeImageProps {
  alt: string;
  className?: string;
  imageClassName?: string;
  lensSize?: number;
  objectFit?: "contain" | "cover";
  onHoverChange?: (active: boolean) => void;
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
 *
 * The magnified view is a second real <img>, not a CSS background — a
 * `background-size` percentage is relative to the LENS's own square box,
 * which stretches non-square source photos to fit that square and makes
 * the zoomed content visibly distorted compared to the real (object-cover,
 * aspect-preserved) photo underneath it. Cloning the actual image and
 * scaling/translating it in real pixels keeps it pixel-for-pixel
 * consistent with what's on screen — the loupe shows a true magnified
 * crop, not a warped one.
 */
export function LoupeImage({
  alt,
  className,
  imageClassName,
  lensSize = 190,
  objectFit = "contain",
  onHoverChange,
  priority,
  sizes,
  src,
  vignette = true,
  zoom = 1.6,
}: LoupeImageProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = React.useState(false);
  const [supportsHover, setSupportsHover] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [lens, setLens] = React.useState({
    containerHeight: 0,
    containerWidth: 0,
    x: 0,
    y: 0,
  });

  React.useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

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

    setLens({
      containerHeight: bounds.height,
      containerWidth: bounds.width,
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    });
  };

  const showLens = isActive && supportsHover && !hasError;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => {
        setIsActive(true);
        onHoverChange?.(true);
      }}
      onMouseLeave={() => {
        setIsActive(false);
        onHoverChange?.(false);
      }}
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      {hasError ? (
        <ImageFallback />
      ) : (
        <Image
          alt={alt}
          blurDataURL={BLUR_DATA_URL}
          className={cn(
            objectFit === "cover" ? "object-cover" : "object-contain",
            "opacity-0 transition-opacity duration-500",
            isLoaded && "opacity-100",
            imageClassName,
          )}
          fill
          onError={() => setHasError(true)}
          onLoad={() => setIsLoaded(true)}
          placeholder="blur"
          priority={priority}
          sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
          src={src}
        />
      )}

      {vignette && !hasError && (
        <div aria-hidden="true" className="krs-photo-grade" />
      )}

      {showLens && (
        <div
          aria-hidden="true"
          className="krs-loupe-lens"
          style={{
            height: lensSize,
            left: lens.x - lensSize / 2,
            overflow: "hidden",
            top: lens.y - lensSize / 2,
            width: lensSize,
          }}
        >
          {/* A zoomed clone of the same object-cover photo, scaled and
              translated by real pixels so the crop under the lens matches
              the visible image exactly — not a background-size guess. */}
          <img
            alt=""
            src={src}
            style={{
              // Tailwind's preflight sets a global `img { max-width: 100%;
              // height: auto }` reset — max-width always wins over an
              // explicit width regardless of inline-style specificity, so
              // without overriding it here this clone silently renders at
              // ~1:1 size (100% of the lens's own tiny width) instead of
              // the intended zoomed size. That mismatch is what made the
              // lens show nothing: the offset math below is computed for
              // the INTENDED zoomed dimensions, so against the actual
              // (unzoomed) rendered size it scrolls all real content
              // outside the lens's visible circle.
              height: lens.containerHeight * zoom,
              left: -(lens.x * zoom - lensSize / 2),
              maxHeight: "none",
              maxWidth: "none",
              objectFit,
              position: "absolute",
              top: -(lens.y * zoom - lensSize / 2),
              width: lens.containerWidth * zoom,
            }}
          />
        </div>
      )}
    </div>
  );
}
