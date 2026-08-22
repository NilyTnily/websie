import { getAllProducts } from "~/lib/queries/catalog";

import { ProductsPageClient } from "./page.client";

// The "on the table" toggle's server action can run self-hosted background
// removal (a few seconds of ML inference) on first enable — bump past the
// platform's default function timeout so that doesn't get cut off. Actions
// invoked from this page run in the same serverless function, so this
// applies to them too.
export const maxDuration = 60;

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return <ProductsPageClient products={products} />;
}
