"use client";

import * as React from "react";

import type { ProductWithRelations } from "~/db/schema";

import { useCart } from "~/lib/hooks/use-cart";
import { ProductCard } from "~/ui/components/product-card";

interface FeaturedProductsGridProps {
  products: ProductWithRelations[];
}

export function FeaturedProductsGrid({ products }: FeaturedProductsGridProps) {
  const { addItem } = useCart();

  const handleAddToCart = React.useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        addItem(
          {
            category: product.category.name,
            id: product.id,
            image: product.image,
            name: product.name,
            price: product.price,
          },
          1,
        );
      }
    },
    [addItem, products],
  );

  return (
    <div
      className={`
        grid grid-cols-1 gap-6
        sm:grid-cols-2
        lg:grid-cols-4
      `}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          onAddToCart={handleAddToCart}
          product={{
            category: product.category.name,
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
  );
}
