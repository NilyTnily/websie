import { getAllProducts } from "~/lib/queries/catalog";

import { ProductsPageClient } from "./page.client";

// The "on the table" toggle's server action can run self-hosted background
// removal (a few seconds of ML inference) on first enable — bump past the
// platform's default function timeout so that doesn't get cut off. Actions
// invoked from this page run in the same serverless function, so this
// applies to them too.
export const maxDuration = 60;

interface AdminProductsPageProps {
  searchParams: Promise<{ stock?: string }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const { stock } = await searchParams;
  const allProducts = await getAllProducts();

  const outOfStockOnly = stock === "out";
  const products = outOfStockOnly
    ? allProducts.filter((product) => !product.inStock)
    : allProducts;

  return (
    <ProductsPageClient
      activeFilter={
        outOfStockOnly
          ? { clearHref: "/admin/products", label: "out of stock" }
          : null
      }
      products={products}
    />
  );
}
