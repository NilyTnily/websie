import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getProductsByCategorySlug } from "~/lib/queries/catalog";
import { CollectionBrowser } from "~/ui/components/collection-browser";

export const metadata = {
  description: "Hand-set stones in 18k gold, one piece at a time.",
  title: "Jewelry — KRS",
};

export default async function JewelryPage() {
  const result = await getProductsByCategorySlug("fine-jewelry");
  if (!result) notFound();
  const { category, products } = result;

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden">
        <div className="relative aspect-[16/6] w-full">
          <img
            alt=""
            className="h-full w-full object-cover"
            src={category.image}
          />
          <div
            className={`
              pointer-events-none absolute inset-0 bg-gradient-to-t
              from-black/70 via-black/10 to-transparent
            `}
          />
        </div>
        <div
          className={`
            absolute inset-x-0 bottom-0 px-6 pb-8
            sm:px-10
          `}
        >
          <div className="mx-auto max-w-7xl">
            <h1
              className={`
                font-display text-3xl text-white
                sm:text-4xl
              `}
            >
              {category.name}
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/80">
              {category.description}
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 py-10">
        <div
          className={`
            container px-4
            md:px-6
          `}
        >
          <Suspense fallback={null}>
            <CollectionBrowser
              categories={[]}
              lockedCategoryId={category.id}
              products={products}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
