"use server";

import type { ProductWithRelations } from "~/db/schema";

import { getFeaturedProducts, getProductsByIds } from "~/lib/queries/catalog";

export async function getWishlistedProductsAction(
  ids: string[],
): Promise<ProductWithRelations[]> {
  return getProductsByIds(ids);
}

export async function getWishlistSuggestionsAction(
  excludeIds: string[],
): Promise<ProductWithRelations[]> {
  const featured = await getFeaturedProducts();
  const excluded = new Set(excludeIds);
  return featured.filter((product) => !excluded.has(product.id)).slice(0, 4);
}
