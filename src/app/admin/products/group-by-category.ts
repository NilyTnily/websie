import type { Subcategory } from "~/db/schema";

export function groupByCategory(
  subcategories: Subcategory[],
): Record<string, Subcategory[]> {
  const map: Record<string, Subcategory[]> = {};
  for (const subcategory of subcategories) {
    const categoryId = subcategory.categoryId;
    if (map[categoryId] === undefined) {
      map[categoryId] = [];
    }
    map[categoryId].push(subcategory);
  }
  return map;
}
