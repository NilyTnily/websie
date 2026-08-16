"use client";

import { Film, RotateCw } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { cn } from "~/lib/cn";
import { ImageFallback } from "~/ui/components/image-fallback";
import { LoupeImage } from "~/ui/components/loupe-image";
import { Product360Viewer } from "~/ui/components/product-360-viewer";

export interface ProductMediaItem {
  mediaType: "360" | "image" | "video";
  url: string;
}

type GalleryEntry =
  | { frames: string[]; kind: "360" }
  | { kind: "image"; url: string }
  | { kind: "video"; url: string };

interface ProductGalleryProps {
  media: ProductMediaItem[];
  name: string;
}

export function ProductGallery({ media, name }: ProductGalleryProps) {
  const entries = React.useMemo(() => buildEntries(media), [media]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [erroredUrls, setErroredUrls] = React.useState<Set<string>>(
    new Set(),
  );
  const [isLoupeActive, setIsLoupeActive] = React.useState(false);

  const markErrored = (url: string) =>
    setErroredUrls((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));

  const selected = entries[selectedIndex];

  return (
    <div>
      <div
        className={`
          relative aspect-square overflow-hidden bg-gradient-to-b from-accent
          to-muted
        `}
      >
        {selected?.kind === "video" ? (
          <video
            className="h-full w-full object-cover"
            controls
            loop
            playsInline
            src={selected.url}
          />
        ) : selected?.kind === "360" ? (
          <Product360Viewer
            alt={name}
            className="h-full w-full"
            frames={selected.frames}
          />
        ) : (
          <LoupeImage
            alt={name}
            className="h-full w-full"
            lensSize={200}
            onHoverChange={setIsLoupeActive}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            src={selected?.url ?? ""}
            zoom={10}
          />
        )}
      </div>
      <p className="krs-meta mt-3 text-xs text-muted-foreground">
        {selected?.kind === "360"
          ? "Drag to rotate"
          : selected?.kind === "video"
            ? "Video"
            : isLoupeActive
              ? "10× — dial, hallmark, setting"
              : "Hover to inspect with the loupe"}
      </p>

      {entries.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {entries.map((entry, index) => {
            const thumbUrl =
              entry.kind === "360" ? (entry.frames[0] ?? "") : entry.url;

            return (
              <button
                className={cn(
                  `
                    relative aspect-square overflow-hidden border-2
                    transition-colors
                  `,
                  index === selectedIndex
                    ? "border-primary"
                    : `
                      border-transparent
                      hover:border-border
                    `,
                )}
                key={`${entry.kind}-${thumbUrl}-${index}`}
                onClick={() => setSelectedIndex(index)}
                type="button"
              >
                {entry.kind === "video" ? (
                  <video
                    className="h-full w-full object-cover"
                    muted
                    src={entry.url}
                  />
                ) : erroredUrls.has(thumbUrl) ? (
                  <ImageFallback />
                ) : (
                  <Image
                    alt={`${name} — view ${index + 1}`}
                    className="object-cover"
                    fill
                    onError={() => markErrored(thumbUrl)}
                    sizes="80px"
                    src={thumbUrl}
                  />
                )}
                {entry.kind !== "image" && (
                  <span
                    className={`
                      absolute right-1 bottom-1 rounded bg-background/80 p-0.5
                      text-foreground
                    `}
                  >
                    {entry.kind === "video" ? (
                      <Film className="h-3 w-3" />
                    ) : (
                      <RotateCw className="h-3 w-3" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// All "360" items collapse into a single interactive entry (its frames, in
// order) so the thumbnail strip shows one tile for the whole spin sequence
// instead of one per frame.
function buildEntries(media: ProductMediaItem[]): GalleryEntry[] {
  const entries: GalleryEntry[] = [];
  const frames: string[] = [];

  for (const item of media) {
    if (item.mediaType === "360") frames.push(item.url);
    else if (item.mediaType === "video") {
      entries.push({ kind: "video", url: item.url });
    } else {
      entries.push({ kind: "image", url: item.url });
    }
  }

  if (frames.length > 0) entries.push({ frames, kind: "360" });

  return entries;
}
