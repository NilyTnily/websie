"use client";

import Image from "next/image";
import Link from "next/link";

import type { ProductCardData } from "~/ui/components/product-card";

import { useSiteSettings } from "~/lib/hooks/use-site-settings";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

interface ShopTheLookProps {
  products: ProductCardData[];
}

/**
 * KRS's answer to Rotfeld's "Shop the Look" hotspot dialogs. Rotfeld
 * overlays hotspots on a styled lifestyle photograph; KRS has no such
 * photography (product shots only), so faking hotspots over a reused
 * establishing shot would just be lying about what the image shows.
 * Instead this pairs two real product photos in one editorial frame —
 * offset and connected by a hairline, same visual idea (two pieces worn
 * together) built entirely from real inventory photography.
 */
export function ShopTheLook({ products }: ShopTheLookProps) {
  const pair = products.slice(0, 2);
  if (pair.length < 2) return null;
  const [first, second] = pair;

  return (
    <section className="py-24">
      <div
        className={`
          container mx-auto max-w-7xl px-4
          sm:px-6
        `}
      >
        <p className="krs-eyebrow text-center text-krs-tobacco">
          Worn together
        </p>
        <h2
          className={`
            mt-3 text-center font-display text-3xl text-foreground
            sm:text-4xl
          `}
        >
          Shop the look
        </h2>

        <div
          className={`
            mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-10
            sm:grid-cols-2 sm:gap-16
          `}
        >
          {/* Vertical stagger only — the two cards no longer overlap
              horizontally, so each keeps its own untouched width and its
              image/text never crowds the other card's. */}
          <LookPiece className="sm:mt-16" product={first} />
          <LookPiece product={second} />
        </div>
      </div>
    </section>
  );
}

function LookPiece({
  className,
  product,
}: {
  className?: string;
  product: ProductCardData;
}) {
  const { noMoneyMode } = useSiteSettings();

  return (
    <Link
      className={`
        group relative block
        ${className ?? ""}
      `}
      href={`/products/${product.id}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        <Image
          alt={product.name}
          className={`
            object-cover transition-transform duration-500
            group-hover:scale-105
          `}
          fill
          sizes="(max-width: 640px) 90vw, 40vw"
          src={product.image}
        />
      </div>
      <div className="krs-hairline mt-3" />
      <div className="mt-3 flex items-center justify-between">
        <p className="krs-meta text-[10px] text-muted-foreground">
          {product.house}
        </p>
        <p className="krs-price text-sm text-foreground">
          {noMoneyMode ? "Contact Us" : CURRENCY_FORMATTER.format(product.price)}
        </p>
      </div>
      <p className="font-display text-base text-foreground">
        {product.name}
      </p>
    </Link>
  );
}
