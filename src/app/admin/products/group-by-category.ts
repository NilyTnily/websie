import type { Model, Subcategory } from "~/db/schema";

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

export function groupModelsBySubcategory(
  models: Model[],
): Record<string, Model[]> {
  const map: Record<string, Model[]> = {};
  for (const model of models) {
    const sid = model.subcategoryId;
    if (map[sid] === undefined) {
      map[sid] = [];
    }
    map[sid].push(model);
  }
  return map;
}
