import { BadgeCheck, Gem, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { categoryHref } from "~/lib/catalog-links";
import { getProductById } from "~/lib/queries/catalog";
import { slugify } from "~/lib/slugify";
import { ProductGallery } from "~/ui/components/product-gallery";
import { ProductReviews } from "~/ui/components/product-reviews";
import { Button } from "~/ui/primitives/button";
import { Separator } from "~/ui/primitives/separator";

import { ProductPurchasePanel } from "./product-purchase-panel";

const trustBar = [
  { icon: BadgeCheck, label: "Hallmarked & Authenticated" },
  { icon: ShieldCheck, label: "Insured White-Glove Shipping" },
  { icon: Gem, label: "Lifetime Care Included" },
];

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-10">
          <div
            className={`
              container px-4
              md:px-6
            `}
          >
            <h1 className="font-display text-3xl text-foreground">
              Piece Not Found
            </h1>
            <p className="mt-4 text-muted-foreground">
              This reference number doesn&apos;t match anything currently in the
              collection.
            </p>
            <Button asChild className="mt-6">
              <Link href="/products">Back to the Collection</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <div
          className={`
            container px-4
            md:px-6
          `}
        >
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol
              className={`
                flex flex-wrap items-center gap-1.5 text-muted-foreground
              `}
            >
              <li>
                <Link className="hover:text-foreground" href="/">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link className="hover:text-foreground" href="/products">
                  Collections
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  className="hover:text-foreground"
                  href={categoryHref(product.category.slug)}
                >
                  {product.category.name}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground">
                {product.name}
              </li>
            </ol>
          </nav>

          <div
            className={`
              grid grid-cols-1 gap-10
              md:grid-cols-2
            `}
          >
            {/* ------------------------ Product image ------------------------ */}
            <ProductGallery
              images={[product.image, ...product.images.map((i) => i.url)]}
              name={product.name}
            />

            {/* ---------------------- Product info -------------------------- */}
            <div className="flex flex-col">
              <p className="krs-ref text-xs text-primary">
                {product.category.name} · Ref. {product.ref}
              </p>
              <h1 className="mt-2 font-display text-3xl text-foreground">
                {product.name}
              </h1>

              <p className="mt-4 text-2xl text-foreground">
                {CURRENCY_FORMATTER.format(product.price)}
              </p>

              <p className="mt-6 text-muted-foreground">
                {product.description}
              </p>

              <div className="krs-hairline mt-6" />

              <ProductPurchasePanel
                category={product.category.name}
                id={product.id}
                image={product.image}
                inStock={product.inStock}
                name={product.name}
                price={product.price}
              />

              <ul className="mt-8 space-y-3">
                {trustBar.map(({ icon: Icon, label }) => (
                  <li
                    className={`
                      flex items-center gap-2.5 text-sm text-muted-foreground
                    `}
                    key={label}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="my-10" />

          {/* ---------------------- Features & Specs ------------------------ */}
          <div
            className={`
              grid grid-cols-1 gap-10
              md:grid-cols-2
            `}
          >
            <section>
              <h2 className="font-display text-xl text-foreground">Details</h2>
              <ul className="mt-4 space-y-2">
                {product.features.map((feature) => (
                  <li
                    className="flex items-start text-sm"
                    key={`feature-${product.id}-${slugify(feature)}`}
                  >
                    <span
                      className={`
                        mt-1.5 mr-2 h-1 w-1 shrink-0 rounded-full bg-primary
                      `}
                    />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground">
                Specification
              </h2>
              <div className="mt-4 space-y-2">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div
                    className={`
                      flex justify-between gap-4 border-b border-border pb-2
                      text-sm
                    `}
                    key={key}
                  >
                    <span className="text-foreground">{key}</span>
                    <span className="krs-ref text-right text-muted-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <Separator className="my-10" />

          <ProductReviews productId={product.id} />
        </div>
      </main>
    </div>
  );
}
