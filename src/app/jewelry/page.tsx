import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getProductsByCategorySlug } from "~/lib/queries/catalog";
import { CollectionBrowser } from "~/ui/components/collection-browser";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1514612497953-05d1e5e171fa?q=80&w=2000&auto=format&fit=crop";

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
        <div className="relative aspect-[16/7] w-full sm:aspect-[16/5] lg:aspect-[16/4.5] 2xl:aspect-[21/6]">
          <Image
            alt="A close-up flat-lay of a gemstone ring"
            className="object-cover"
            fill
            priority
            sizes="100vw"
            src={HERO_IMAGE}
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
            absolute inset-x-0 bottom-0 px-4 pb-6
            sm:px-6 sm:pb-8
            lg:px-8 lg:pb-10
            2xl:px-10
          `}
        >
          <div className="mx-auto max-w-[1920px]">
            <h1
              className={`
                font-display text-[28px] leading-none text-white
                sm:text-4xl
                lg:text-5xl
                2xl:text-6xl
              `}
            >
              {category.name}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80 sm:text-[15px]">
              {category.description}
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 py-8 sm:py-10">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 2xl:px-10">
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
