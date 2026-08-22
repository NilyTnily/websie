import { Suspense } from "react";

import {
  getCategoriesWithCounts,
  getVisibleProducts,
} from "~/lib/queries/catalog";
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
      getVisibleProducts(),
    ]);
  const initialCategoryId = categories.find((c) => c.slug === categorySlug)?.id;
  const houseCount = new Set(
    products.map((p) => p.subcategory?.name).filter(Boolean),
  ).size;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-8 sm:py-10">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 2xl:px-10">
          <div className="mb-8 sm:mb-10">
            <p className="krs-eyebrow text-krs-tobacco">
              {products.length} pieces · {houseCount} houses
            </p>
            <h1 className="mt-3 font-display text-[34px] leading-none text-foreground sm:text-[46px]">
              The Collection
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every piece currently on the shelf — watches and fine jewelry, together.
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
