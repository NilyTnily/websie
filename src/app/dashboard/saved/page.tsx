"use client";

import Link from "next/link";
import * as React from "react";

import type { ProductWithRelations } from "~/db/schema";

import {
  getWishlistedProductsAction,
  getWishlistSuggestionsAction,
} from "~/app/actions/wishlist";
import { useWishlist } from "~/lib/hooks/use-wishlist";
import { FeaturedProductsGrid } from "~/ui/components/featured-products-grid";
import { ProductCard } from "~/ui/components/product-card";
import { Button } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";

export default function FavoritesPage() {
  const { itemIds } = useWishlist();
  const [products, setProducts] = React.useState<null | ProductWithRelations[]>(
    null,
  );
  const [suggestions, setSuggestions] = React.useState<
    null | ProductWithRelations[]
  >(null);

  React.useEffect(() => {
    let cancelled = false;
    setProducts(null);
    getWishlistedProductsAction(itemIds).then((result) => {
      if (!cancelled) setProducts(result);
    });
    return () => {
      cancelled = true;
    };
  }, [itemIds]);

  React.useEffect(() => {
    let cancelled = false;
    getWishlistSuggestionsAction(itemIds).then((result) => {
      if (!cancelled) setSuggestions(result);
    });
    return () => {
      cancelled = true;
    };
  }, [itemIds]);

  return (
    <div>
      <div className="space-y-0.5 pb-8">
        <h2 className="font-display text-2xl text-foreground">Favorites</h2>
        <p className="text-muted-foreground">
          Pieces you&apos;ve set aside for later.
        </p>
      </div>

      {products === null ? (
        <div
          className={`
            grid grid-cols-2 gap-6
            sm:grid-cols-3
          `}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton className="aspect-[4/5] w-full" key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Nothing favorites yet.</p>
          <Button asChild className="mt-4 rounded-none" variant="outline">
            <Link href="/products">Browse the Collection</Link>
          </Button>
        </div>
      ) : (
        <div
          className={`
            grid grid-cols-2 gap-x-7 gap-y-9
            sm:grid-cols-3
          `}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                house: product.subcategory?.name ?? product.category.name,
                id: product.id,
                image: product.image,
                inStock: product.inStock,
                name: product.name,
                price: product.price,
                ref: product.ref,
              }}
            />
          ))}
        </div>
      )}

      {suggestions === null ? (
        <div className="mt-12 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className={`
            grid grid-cols-2 gap-4
            sm:grid-cols-4
          `}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton className="aspect-[4/5] w-full" key={i} />
            ))}
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="mt-12">
          <h3 className="font-display text-xl text-foreground">
            You May Also Like
          </h3>
          <div className="mt-6">
            <FeaturedProductsGrid products={suggestions} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
