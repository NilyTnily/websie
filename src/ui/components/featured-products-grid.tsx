import type { ProductWithRelations } from "~/db/schema";

import { ProductCard } from "~/ui/components/product-card";

interface FeaturedProductsGridProps {
  products: ProductWithRelations[];
}

export function FeaturedProductsGrid({ products }: FeaturedProductsGridProps) {
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
  );
}
