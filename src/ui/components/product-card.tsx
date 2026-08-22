"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { useSiteSettings } from "~/lib/hooks/use-site-settings";
import { useWishlist } from "~/lib/hooks/use-wishlist";
import { BLUR_DATA_URL } from "~/lib/image-placeholder";
import { ImageFallback } from "~/ui/components/image-fallback";
import { Button } from "~/ui/primitives/button";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

type ProductCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  product: {
    house: string;
    id: string;
    image: string;
    inStock?: boolean;
    name: string;
    price: number;
    ref: string;
  };
};

export function ProductCard({
  className,
  product,
  ...props
}: ProductCardProps) {
  const { noMoneyMode } = useSiteSettings();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const isInWishlist = isWishlisted(product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product.id);
  };

  return (
    <div className={cn("group relative", className)} {...props}>
      <Link className="block" href={`/products/${product.id}`}>
        <div
          className="relative overflow-hidden bg-card"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={`
              relative aspect-[4/5] overflow-hidden bg-gradient-to-b
              from-accent to-muted
            `}
          >
            {hasError ? (
              <ImageFallback />
            ) : (
              <Image
                alt={product.name}
                blurDataURL={BLUR_DATA_URL}
                className={cn(
                  `
                    object-cover opacity-0 transition-[opacity,transform]
                    duration-500 ease-out
                  `,
                  isHovered && "scale-105",
                  isLoaded && "opacity-100",
                )}
                fill
                onError={() => setHasError(true)}
                onLoad={() => setIsLoaded(true)}
                placeholder="blur"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
                src={product.image}
              />
            )}

            <div aria-hidden="true" className="krs-photo-grade" />

            {!product.inStock && (
              <div
                className={`
                  absolute inset-0 flex items-center justify-center
                  bg-background/85 backdrop-blur-sm
                `}
              >
                <span className="krs-meta text-xs text-muted-foreground">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          <div className="krs-hairline" />

          <div className="flex items-baseline justify-between p-4">
            <div className="min-w-0">
              <p className="krs-meta text-[10px] text-muted-foreground">
                {product.house} · Ref. {product.ref}
              </p>
              <h3
                className={`
                  mt-1 line-clamp-2 font-display text-base text-foreground
                `}
              >
                {product.name}
              </h3>
            </div>
            <span className="krs-price shrink-0 pl-3 text-sm text-foreground">
              {noMoneyMode
                ? "Contact Us"
                : CURRENCY_FORMATTER.format(product.price)}
            </span>
          </div>
        </div>
      </Link>

      <Button
        aria-pressed={isInWishlist}
        className={cn(
          `
            absolute top-2 right-2 z-10 h-9 w-9 rounded-none border-krs-ivory/60
            bg-background/80 backdrop-blur-sm transition-opacity duration-300
            lg:h-[30px] lg:w-[30px]
          `,
          !isHovered && !isInWishlist && "lg:opacity-0",
        )}
        onClick={handleToggleWishlist}
        size="icon"
        type="button"
        variant="outline"
      >
        <Heart
          className={cn(
            "h-4 w-4",
            isInWishlist
              ? "fill-secondary text-secondary"
              : "text-muted-foreground",
          )}
        />
        <span className="sr-only">
          {isInWishlist ? "Remove from wishlist" : "Save to wishlist"}
        </span>
      </Button>
    </div>
  );
}
