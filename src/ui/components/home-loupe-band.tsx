"use client";

import * as React from "react";

import { LoupeImage } from "~/ui/components/loupe-image";

interface HomeLoupeBandProps {
  alt: string;
  src: string;
}

/** The home page's "Under the loupe" band image — same loupe zoom used everywhere, with a caption overlaid on the image that swaps on hover, matching the product gallery's pattern. */
export function HomeLoupeBand({ alt, src }: HomeLoupeBandProps) {
  const [isActive, setIsActive] = React.useState(false);

  return (
    <div className="relative aspect-[4/3] overflow-hidden">
      <LoupeImage
        alt={alt}
        className="h-full w-full"
        lensSize={200}
        onHoverChange={setIsActive}
        sizes="(max-width: 1024px) 100vw, 55vw"
        src={src}
        zoom={2.7}
      />
      <p
        className={`
          krs-eyebrow pointer-events-none absolute bottom-5 left-5
          text-krs-ivory/60
        `}
      >
        {isActive ? "10× — dial, hallmark, setting" : "Move across the image"}
      </p>
    </div>
  );
}
