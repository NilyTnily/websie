"use client";

import Image from "next/image";
import * as React from "react";

import { cn } from "~/lib/cn";
import { LoupeImage } from "~/ui/components/loupe-image";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selected, setSelected] = React.useState(images[0] ?? "");

  return (
    <div>
      <div
        className={`
          relative overflow-hidden bg-gradient-to-b from-accent to-muted
        `}
      >
        <LoupeImage
          alt={name}
          className="aspect-square w-full"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          src={selected}
        />
      </div>
      <p className="krs-ref mt-3 text-xs text-muted-foreground">
        Hover to inspect with the loupe
      </p>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              className={cn(
                `
                  relative aspect-square overflow-hidden border-2
                  transition-colors
                `,
                image === selected
                  ? "border-primary"
                  : `
                    border-transparent
                    hover:border-border
                  `,
              )}
              key={image}
              onClick={() => setSelected(image)}
              type="button"
            >
              <Image
                alt={`${name} — view ${index + 1}`}
                className="object-cover"
                fill
                sizes="80px"
                src={image}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
