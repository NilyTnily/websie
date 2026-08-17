import { Suspense } from "react";

import { getAllProducts, getCategoriesWithCounts } from "~/lib/queries/catalog";
import { CollectionBrowser } from "~/ui/components/collection-browser";

interface ProductsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const [{ category: categorySlug }, categories, products] =
    await Promise.all([
      searchParams,
      getCategoriesWithCounts(),
      getAllProducts(),
    ]);
  const initialCategoryId = categories.find((c) => c.slug === categorySlug)?.id;
  const houseCount = new Set(
    products.map((p) => p.subcategory?.name).filter(Boolean),
  ).size;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <div
          className={`
            container px-4
            md:px-6
          `}
        >
          <div className="mb-8">
            <p className="krs-eyebrow text-krs-tobacco">
              {products.length} pieces · {houseCount} houses
            </p>
            <h1 className="mt-3 font-display text-[46px] text-foreground">
              The Collection
            </h1>
            <p className="mt-2 text-muted-foreground">
              Every piece currently on the shelf.
            </p>
          </div>

          <Suspense fallback={null}>
            <CollectionBrowser
              categories={categories}
              initialCategoryId={initialCategoryId}
              products={products}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
