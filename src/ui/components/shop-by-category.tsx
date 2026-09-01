import Image from "next/image";
import Link from "next/link";

import type { CategoryWithCount } from "~/db/schema";

interface ShopByCategoryProps {
  categories: CategoryWithCount[];
}

// Tailwind's JIT scanner only picks up class names it can find as literal
// strings in source — a template-interpolated `sm:grid-cols-${n}` never
// gets generated. This map keeps every possible column count as a literal
// the scanner can see, capped at 4 wide to match the tile size.
const GRID_COLS_CLASS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

/** Homepage "shop by type" grid — one tile per top-level category, its own catalog photo as the tile's background (categoryTable.image, already required on every category), linking into the catalog pre-filtered to it. */
export function ShopByCategory({ categories }: ShopByCategoryProps) {
  const tiles = categories.filter((category) => category.productCount > 0);
  if (tiles.length === 0) return null;

  return (
    <section className="py-24">
      <div
        className={`
          container mx-auto max-w-7xl px-4
          sm:px-6
        `}
      >
        <p className="krs-eyebrow text-center text-krs-tobacco">
          The collection
        </p>
        <h2
          className={`
            mt-3 text-center font-display text-3xl text-foreground
            sm:text-4xl
          `}
        >
          Shop by type
        </h2>
        <div
          className={`
            mt-12 grid grid-cols-2 gap-px bg-krs-champagne/25
            ${GRID_COLS_CLASS[Math.min(tiles.length, 4)]}
          `}
        >
          {tiles.map((category) => (
            <Link
              className={`
                group relative flex aspect-square flex-col items-center
                justify-center gap-2 overflow-hidden
              `}
              href={`/products?category=${category.slug}`}
              key={category.id}
            >
              <Image
                alt={category.name}
                className={`
                  object-cover transition-transform duration-500
                  group-hover:scale-105
                `}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                src={category.image}
              />
              <div
                aria-hidden="true"
                className={`
                  absolute inset-0 bg-krs-onyx/45 transition-colors
                  group-hover:bg-krs-onyx/60
                `}
              />
              <span
                className={`
                  relative font-display text-xl text-krs-ivory
                  drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]
                `}
              >
                {category.name}
              </span>
              <span
                className={`
                  krs-label relative text-krs-champagne opacity-0
                  transition-opacity
                  group-hover:opacity-100
                `}
              >
                Shop now
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
