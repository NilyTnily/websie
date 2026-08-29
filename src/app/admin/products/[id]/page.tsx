import { notFound } from "next/navigation";

import {
  getAllModels,
  getAllSubcategories,
  getCategoriesWithCounts,
  getProductById,
} from "~/lib/queries/catalog";

import { updateProductAction } from "../actions";
import { groupByCategory, groupModelsBySubcategory } from "../group-by-category";
import { ProductForm } from "../product-form";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const [product, categories, subcategories, models] = await Promise.all([
    getProductById(id),
    getCategoriesWithCounts(),
    getAllSubcategories(),
    getAllModels(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Edit Product</h2>
      <ProductForm
        action={updateProductAction.bind(null, product.id)}
        categories={categories}
        defaultValues={{
          ...product,
          media: product.images.map((image) => ({
            mediaType: image.mediaType,
            url: image.url,
          })),
        }}
        modelsBySubcategory={groupModelsBySubcategory(models)}
        subcategoriesByCategory={groupByCategory(subcategories)}
        submitLabel="Save Changes"
      />
    </div>
  );
}
