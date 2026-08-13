import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { categoryHref } from "~/lib/catalog-links";
import {
  getCategoriesWithCounts,
  getFeaturedProducts,
} from "~/lib/queries/catalog";
import { getTestimonials } from "~/lib/queries/testimonials";
import { FeaturedProductsGrid } from "~/ui/components/featured-products-grid";
import { TestimonialsSection } from "~/ui/components/testimonials/testimonials-with-marquee";
import { Button } from "~/ui/primitives/button";

const HERO_VIDEO_POSTER =
  "https://images.unsplash.com/photo-1633451238042-85d93d267866?w=1600&auto=format&fit=crop&q=80";

export default async function HomePage() {
  const [categories, featuredProducts, testimonials] = await Promise.all([
    getCategoriesWithCounts(),
    getFeaturedProducts(),
    getTestimonials(),
  ]);

  return (
    <main className="flex min-h-screen flex-col">
      {/* ---------------------------------- Hero ---------------------------------- */}
      <section className="krs-hero-in relative overflow-hidden">
        <div
          className={`
            relative h-[calc(100svh-var(--header-height))] max-h-[880px]
            min-h-[480px] w-full
          `}
        >
          <video
            aria-label="Close-up of a Swiss mechanical watch movement, gears and jewels turning"
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
            loop
            muted
            playsInline
            poster={HERO_VIDEO_POSTER}
            preload="auto"
            src="/luxury-watch-cgi-animation.mp4"
          />
        </div>
        <div
          className={`
            pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70
            via-black/10 to-transparent
          `}
        />
        <div
          className={`
            absolute inset-x-0 bottom-0 px-6 pb-10
            sm:px-10 sm:pb-14
          `}
        >
          <div className="mx-auto max-w-7xl">
            <h1
              className={`
                max-w-lg font-display text-4xl leading-[1.1] font-normal
                text-white
                sm:text-5xl
              `}
            >
              Precision worn close.
            </h1>
            <p
              className={`
                mt-4 max-w-sm text-sm text-white/80
                sm:text-base
              `}
            >
              Automatic movements finished by hand, stones set one at a time,
              and a small archive of vintage pieces restored ourselves.
            </p>
            <Link href="/products">
              <Button
                className={`
                  mt-6 h-11 border-white/60 bg-transparent px-6 text-xs
                  font-medium tracking-[0.15em] text-white uppercase
                  hover:bg-white/10 hover:text-white
                `}
                variant="outline"
              >
                Discover
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------- Bridge band ---------------------------- */}
      <div
        aria-hidden="true"
        className={`
          h-4 bg-muted
          sm:h-6
        `}
      />

      {/* ------------------------------ Collections ----------------------------- */}
      <section className="py-20">
        <div
          className={`
            container mx-auto max-w-7xl px-4
            sm:px-6
          `}
        >
          <div className="mb-10 text-center">
            <h2
              className={`
                font-display text-3xl text-foreground
                sm:text-4xl
              `}
            >
              Collections
            </h2>
          </div>
          <div
            className={`
              grid grid-cols-1 gap-10
              sm:grid-cols-3
            `}
          >
            {categories.map((category) => (
              <Link
                aria-label={`Browse ${category.name}`}
                className="group block text-center"
                href={categoryHref(category.slug)}
                key={category.id}
              >
                <div
                  className={`
                    relative aspect-square overflow-hidden bg-gradient-to-b
                    from-accent to-muted
                  `}
                >
                  <img
                    alt=""
                    className={`
                      h-full w-full object-cover transition duration-500
                      group-hover:scale-105
                    `}
                    loading="lazy"
                    src={category.image}
                  />
                </div>
                <h3 className="mt-5 font-display text-xl text-foreground">
                  {category.name}
                </h3>
                <p
                  className={`
                    mx-auto mt-1 max-w-[22ch] text-sm text-muted-foreground
                  `}
                >
                  {category.description}
                </p>
                <p
                  className={`
                    mt-3 text-xs font-medium tracking-[0.15em] text-primary
                    uppercase
                  `}
                >
                  Discover {category.name}{" "}
                  <ArrowRight className={`ml-1 inline h-3 w-3`} />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="krs-hairline container mx-auto max-w-7xl" />

      {/* ------------------------------- Featured -------------------------------- */}
      <section className="py-20">
        <div
          className={`
            container mx-auto max-w-7xl px-4
            sm:px-6
          `}
        >
          <div className="mb-10 flex items-end justify-between">
            <h2
              className={`
                font-display text-3xl text-foreground
                sm:text-4xl
              `}
            >
              From the Current Shelf
            </h2>
            <Link
              className={`
                hidden items-center gap-1 text-sm text-muted-foreground
                hover:text-primary
                sm:flex
              `}
              href="/products"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <FeaturedProductsGrid products={featuredProducts} />
        </div>
      </section>

      {/* ------------------------------ Testimonials ----------------------------- */}
      {testimonials.length > 0 && (
        <TestimonialsSection
          description="Notes from the client book — unedited, on request."
          testimonials={testimonials.map((testimonial) => ({
            author: {
              avatar: testimonial.avatarUrl ?? "",
              handle: testimonial.customerHandle,
              name: testimonial.customerName,
            },
            text: testimonial.quote,
          }))}
          title="From the Client Book"
        />
      )}

      {/* ---------------------------------- CTA ----------------------------------- */}
      <section className="py-20">
        <div
          className={`
            container mx-auto max-w-7xl px-4
            sm:px-6
          `}
        >
          <div
            className={`
              flex flex-col items-center gap-6 bg-muted px-8 py-16 text-center
            `}
          >
            <h2
              className={`
                max-w-xl font-display text-3xl text-foreground
                sm:text-4xl
              `}
            >
              Open a client account
            </h2>
            <p className="max-w-md text-muted-foreground">
              Track orders, save pieces to a wishlist, and keep a record of
              every service and restoration on your collection.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/auth/sign-up">
                <Button
                  className={`
                    h-11 px-8 text-xs font-medium tracking-[0.15em] uppercase
                  `}
                  variant="outline"
                >
                  Create Account
                </Button>
              </Link>
              <Link href="/products">
                <Button
                  className={`
                    h-11 px-8 text-xs font-medium tracking-[0.15em] uppercase
                  `}
                  variant="outline"
                >
                  Browse the Collection
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
