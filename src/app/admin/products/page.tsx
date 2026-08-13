import { getAllProducts } from "~/lib/queries/catalog";

import { ProductsPageClient } from "./page.client";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return <ProductsPageClient products={products} />;
}
