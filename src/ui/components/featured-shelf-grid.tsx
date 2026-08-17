import Image from "next/image";
import Link from "next/link";

import type { ProductWithRelations } from "~/db/schema";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

interface FeaturedShelfGridProps {
  products: ProductWithRelations[];
}

/** The home page's "Current shelf" — one large hero card plus two columns of two stacked cards, per the redesign's asymmetric 1.35fr/1fr/1fr layout. */
export function FeaturedShelfGrid({ products }: FeaturedShelfGridProps) {
  const [hero, ...rest] = products;
  if (!hero) return null;
  const columnA = rest.slice(0, 2);
  const columnB = rest.slice(2, 4);

  return (
    <div
      className={`
        grid grid-cols-1 gap-8
        lg:grid-cols-[1.35fr_1fr_1fr]
      `}
    >
      <ShelfCard aspect="aspect-[3/4]" product={hero} />
      {[columnA, columnB].map((column, i) => (
        <div className="flex flex-col gap-8" key={i}>
          {column.map((product) => (
            <ShelfCard aspect="aspect-square" key={product.id} product={product} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ShelfCard({
  aspect,
  product,
}: {
  aspect: string;
  product: ProductWithRelations;
}) {
  const house = product.subcategory?.name ?? product.category.name;

  return (
    <Link className="group block" href={`/products/${product.id}`}>
      <div className={`
        relative overflow-hidden bg-muted
        ${aspect}
      `}>
        <Image
          alt={product.name}
          className={`
            object-cover transition-transform duration-500
            group-hover:scale-105
          `}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          src={product.image}
        />
      </div>
      <div className="krs-hairline mt-4" />
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="krs-meta text-krs-tobacco">
            {house} · {product.ref}
          </p>
          <p className="mt-1 truncate font-display text-lg text-foreground">
            {product.name}
          </p>
        </div>
        <span className="krs-price shrink-0 text-foreground">
          {CURRENCY_FORMATTER.format(product.price)}
        </span>
      </div>
    </Link>
  );
}
