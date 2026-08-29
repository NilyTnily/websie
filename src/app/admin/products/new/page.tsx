import {
  getAllModels,
  getAllSubcategories,
  getCategoriesWithCounts,
} from "~/lib/queries/catalog";

import { createProductAction } from "../actions";
import { groupByCategory, groupModelsBySubcategory } from "../group-by-category";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const [categories, subcategories, models] = await Promise.all([
    getCategoriesWithCounts(),
    getAllSubcategories(),
    getAllModels(),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">New Product</h2>
      <ProductForm
        action={createProductAction}
        categories={categories}
        modelsBySubcategory={groupModelsBySubcategory(models)}
        subcategoriesByCategory={groupByCategory(subcategories)}
        submitLabel="Create Product"
      />
    </div>
  );
}
