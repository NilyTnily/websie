"use server";

import type { ProductWithRelations } from "~/db/schema";

import { getProductsByIds } from "~/lib/queries/catalog";

export async function getWishlistedProductsAction(
  ids: string[],
): Promise<ProductWithRelations[]> {
  return getProductsByIds(ids);
}
