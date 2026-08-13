import { getAllProducts, getCategoriesWithCounts } from "~/lib/queries/catalog";
import { CollectionBrowser } from "~/ui/components/collection-browser";

interface ProductsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const [{ category: categorySlug }, categories, products] = await Promise.all([
    searchParams,
    getCategoriesWithCounts(),
    getAllProducts(),
  ]);
  const initialCategoryId = categories.find((c) => c.slug === categorySlug)?.id;

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
            <h1 className="font-display text-3xl text-foreground">
              The Collection
            </h1>
            <p className="mt-1 text-muted-foreground">
              Every piece currently on the shelf.
            </p>
          </div>

          <CollectionBrowser
            categories={categories}
            initialCategoryId={initialCategoryId}
            products={products}
          />
        </div>
      </main>
    </div>
  );
}
