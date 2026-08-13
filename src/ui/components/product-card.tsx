"use client";

import { Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";
import { useWishlist } from "~/lib/hooks/use-wishlist";
import { BLUR_DATA_URL } from "~/lib/image-placeholder";
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
  onAddToCart?: (productId: string) => void;
  product: {
    category: string;
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
  onAddToCart,
  product,
  ...props
}: ProductCardProps) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const isInWishlist = isWishlisted(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart?.(product.id);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product.id);
  };

  return (
    <div className={cn("group", className)} {...props}>
      <Link href={`/products/${product.id}`}>
        <div
          className={`
            relative overflow-hidden bg-card transition-shadow duration-300
            hover:shadow-lg
          `}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={`
              relative aspect-square overflow-hidden bg-gradient-to-b
              from-accent to-muted
            `}
          >
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
              onLoad={() => setIsLoaded(true)}
              placeholder="blur"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              src={product.image}
            />

            <div aria-hidden="true" className="krs-photo-grade" />

            <Button
              aria-pressed={isInWishlist}
              className={cn(
                `
                  absolute right-2 bottom-2 z-10 rounded-full bg-background/80
                  backdrop-blur-sm transition-opacity duration-300
                `,
                !isHovered && !isInWishlist && "opacity-0",
              )}
              onClick={handleAddToWishlist}
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

            {!product.inStock && (
              <div
                className={`
                  absolute inset-0 flex items-center justify-center
                  bg-background/85 backdrop-blur-sm
                `}
              >
                <span className="krs-ref text-xs text-muted-foreground">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            <p className="krs-ref text-[11px] text-muted-foreground">
              {product.category} · Ref. {product.ref}
            </p>
            <h3
              className={`
                mt-1 line-clamp-2 font-display text-base text-foreground
              `}
            >
              {product.name}
            </h3>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-foreground">
                {CURRENCY_FORMATTER.format(product.price)}
              </span>
              <Button
                className="h-8 gap-1.5 px-3 text-xs"
                disabled={!product.inStock}
                onClick={handleAddToCart}
                size="sm"
                variant="ghost"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Add to Bag
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
