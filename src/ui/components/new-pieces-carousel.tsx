"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProductCard, type ProductCardData } from "~/ui/components/product-card";

interface NewPiecesCarouselProps {
  products: ProductCardData[];
}

const SCROLL_STEP_PX = 340;
// How close to an edge (px) still counts as "at the edge" — scrollLeft
// rarely lands on exactly 0 or exactly maxScroll due to snap easing and
// sub-pixel rounding, so a small tolerance avoids buttons staying
// spuriously enabled/disabled by a fraction of a pixel.
const EDGE_TOLERANCE_PX = 4;

/** Horizontal scroll-snap carousel for the homepage's "New Pieces" strip — KRS's answer to Rotfeld's own new-arrivals carousel, built on native CSS scroll-snap plus two arrow buttons rather than a slider dependency. Buttons disable at either end so they never read as clickable when there's nowhere left to scroll. */
export function NewPiecesCarousel({ products }: NewPiecesCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function updateScrollState() {
      if (!track) return;
      setCanScrollPrev(track.scrollLeft > EDGE_TOLERANCE_PX);
      setCanScrollNext(
        track.scrollLeft < track.scrollWidth - track.clientWidth - EDGE_TOLERANCE_PX,
      );
    }

    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [products.length]);

  if (products.length === 0) return null;

  function scrollBy(direction: -1 | 1) {
    trackRef.current?.scrollBy({
      behavior: "smooth",
      left: direction * SCROLL_STEP_PX,
    });
  }

  return (
    <div className="relative">
      <div
        className={`
          no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto
          scroll-smooth pb-2
        `}
        ref={trackRef}
      >
        {products.map((product) => (
          <ProductCard
            className={`
              w-[72vw] shrink-0 snap-start
              sm:w-[280px]
            `}
            key={product.id}
            product={product}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          aria-label="Previous pieces"
          className={`
            flex h-9 w-9 items-center justify-center border
            border-krs-champagne/40 text-krs-tobacco transition-colors
            hover:border-krs-champagne hover:text-krs-champagne
            disabled:cursor-not-allowed disabled:opacity-30
            disabled:hover:border-krs-champagne/40
            disabled:hover:text-krs-tobacco
          `}
          disabled={!canScrollPrev}
          onClick={() => scrollBy(-1)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          aria-label="Next pieces"
          className={`
            flex h-9 w-9 items-center justify-center border
            border-krs-champagne/40 text-krs-tobacco transition-colors
            hover:border-krs-champagne hover:text-krs-champagne
            disabled:cursor-not-allowed disabled:opacity-30
            disabled:hover:border-krs-champagne/40
            disabled:hover:text-krs-tobacco
          `}
          disabled={!canScrollNext}
          onClick={() => scrollBy(1)}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
