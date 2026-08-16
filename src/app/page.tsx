import Link from "next/link";

import { categoryHref } from "~/lib/catalog-links";
import {
  getCategoriesWithCounts,
  getFeaturedProducts,
  getProductCount,
  getSubcategoriesWithCounts,
} from "~/lib/queries/catalog";
import { getHomepageSettings } from "~/lib/queries/homepage";
import { getTestimonials } from "~/lib/queries/testimonials";
import { FeaturedShelfGrid } from "~/ui/components/featured-shelf-grid";
import { HouseMarquee } from "~/ui/components/house-marquee";
import { LoupeImage } from "~/ui/components/loupe-image";
import { Button } from "~/ui/primitives/button";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

// The four house promises — static copy with no natural home in the
// singleton homepageSettings CMS shape (which holds flat strings/hrefs, not
// repeatable item lists). Not worth a schema change for one static block.
const STANDARD_PROMISES = [
  {
    body: "Every movement is serviced by our own workshop, never shipped to a third party.",
    n: "01",
    title: "Serviced in-house",
  },
  {
    body: "Metal hallmarked, stones graded, every piece shipped with a written provenance record.",
    n: "02",
    title: "Hallmarked & authenticated",
  },
  {
    body: "Every order travels insured to declared value, in a fitted presentation case.",
    n: "03",
    title: "Insured, signature only",
  },
  {
    body: "Resizing, restringing and cleaning are free for the life of the piece.",
    n: "04",
    title: "Lifetime care",
  },
];

export default async function HomePage() {
  const [
    categories,
    featuredProducts,
    houses,
    productCount,
    testimonials,
    homepageSettings,
  ] = await Promise.all([
    getCategoriesWithCounts(),
    getFeaturedProducts(),
    getSubcategoriesWithCounts(),
    getProductCount(),
    getTestimonials(),
    getHomepageSettings(),
  ]);

  const heroVideoPoster = homepageSettings.heroVideoPoster ?? undefined;
  const heroVideoUrl = homepageSettings.heroVideoUrl ?? "/luxury-watch-cgi-animation.mp4";
  const inFramePiece = featuredProducts[0];
  const pullQuote = testimonials[0];

  return (
    <main className="flex min-h-screen flex-col">
      {/* ---------------------------------- Hero ---------------------------------- */}
      <section className="krs-hero-in relative overflow-hidden bg-krs-onyx">
        <div
          className={`
            relative h-[calc(100svh-var(--header-height))] max-h-[880px]
            min-h-[480px] w-full
          `}
        >
          <video
            aria-label="Close-up of a Swiss mechanical watch movement, gears and jewels turning"
            autoPlay
            className={`
              absolute inset-0 h-full w-full object-cover opacity-[.82]
            `}
            loop
            muted
            playsInline
            poster={heroVideoPoster}
            preload="auto"
            src={heroVideoUrl}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(13,13,13,.86) 0%, rgba(13,13,13,.45) 46%, rgba(13,13,13,.15) 70%, rgba(43,30,23,.5) 100%)",
          }}
        />
        <div
          className={`
            absolute inset-x-0 bottom-0 px-6 pb-10
            sm:px-10 sm:pb-14
          `}
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-[640px]">
              <h1
                className={`
                  font-display text-4xl leading-[1.06] font-normal
                  text-krs-ivory
                  sm:text-6xl
                  lg:text-[82px]
                `}
              >
                {homepageSettings.heroTitle}
              </h1>
              <div className="mt-6 h-px w-16 bg-krs-champagne" />
              <p
                className={`
                  mt-6 max-w-sm text-sm text-krs-ivory/80
                  sm:text-base
                `}
              >
                {homepageSettings.heroSubtitle}
              </p>
              <Link href={homepageSettings.heroCtaHref}>
                <Button
                  className={`
                    mt-8 h-[52px] rounded-none bg-krs-champagne px-[34px]
                    text-xs font-semibold tracking-[0.22em] text-krs-mocha
                    uppercase
                    hover:bg-krs-champagne-light
                  `}
                >
                  {homepageSettings.heroCtaText}
                </Button>
              </Link>
            </div>
          </div>

          {inFramePiece && (
            <Link
              className={`
                absolute right-6 bottom-10 hidden w-[268px] border
                border-krs-champagne/40 p-4 backdrop-blur-md
                sm:right-10 sm:block
              `}
              href={`/products/${inFramePiece.id}`}
              style={{ background: "rgba(13,13,13,.55)" }}
            >
              <p className="krs-eyebrow text-krs-champagne">In frame</p>
              <p className="mt-2 font-display text-base text-krs-ivory">
                {inFramePiece.name}
              </p>
              <p className="krs-meta mt-1 text-krs-ivory/60">
                {CURRENCY_FORMATTER.format(inFramePiece.price)}
              </p>
            </Link>
          )}
        </div>
      </section>

      {/* ---------------------------- House marquee ------------------------------ */}
      <HouseMarquee houses={houses.map((h) => h.name)} />

      {/* ------------------------------ Current shelf ----------------------------- */}
      <section className="py-20">
        <div
          className={`
            container mx-auto max-w-7xl px-4
            sm:px-6
          `}
        >
          <div
            className={`
              mb-10 flex items-end justify-between gap-4 border-b border-border
              pb-6
            `}
          >
            <div>
              <p className="krs-eyebrow text-krs-tobacco">
                {homepageSettings.featuredTitle}
              </p>
              <h2
                className={`
                  mt-3 font-display text-3xl text-foreground
                  sm:text-4xl
                `}
              >
                Nothing here is made twice
              </h2>
            </div>
            <Link
              className={`
                shrink-0 text-sm text-muted-foreground
                hover:text-primary
              `}
              href={homepageSettings.featuredCtaHref}
            >
              All {productCount} pieces →
            </Link>
          </div>
          <FeaturedShelfGrid products={featuredProducts} />
        </div>
      </section>

      {/* ---------------------------- Under the loupe ----------------------------- */}
      <section className="bg-krs-onyx-raised py-20">
        <div
          className={`
            container mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4
            sm:px-6
            lg:grid-cols-[1.1fr_.9fr] lg:gap-[72px]
          `}
        >
          {inFramePiece && (
            <div className="relative aspect-[4/3] overflow-hidden">
              <LoupeImage
                alt={inFramePiece.name}
                className="h-full w-full"
                lensSize={200}
                sizes="(max-width: 1024px) 100vw, 55vw"
                src={inFramePiece.image}
                zoom={2.7}
              />
            </div>
          )}
          <div className="flex flex-col justify-center">
            <p className="krs-eyebrow text-krs-champagne">The signature</p>
            <h2 className={`
              mt-3 font-display text-3xl text-krs-ivory
              sm:text-4xl
            `}>
              Under the loupe
            </h2>
            <p className="mt-4 max-w-md text-krs-ivory/70">
              Move across any photograph in the collection and the lens
              follows — the same detail you'd see leaning over the bench.
            </p>
            <div
              className={`mt-8 grid grid-cols-3 gap-px bg-krs-champagne/25`}
            >
              {[
                { label: "Zoom", value: "10×" },
                { label: "Pieces", value: String(productCount) },
                { label: "Service", value: "In-house" },
              ].map((stat) => (
                <div className="bg-krs-onyx-raised px-4 py-6" key={stat.label}>
                  <p className="font-display text-2xl text-krs-ivory">
                    {stat.value}
                  </p>
                  <p className="krs-meta mt-2 text-krs-ivory/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- Two houses ------------------------------ */}
      <section
        className={`
          grid grid-cols-1
          sm:grid-cols-2
        `}
      >
        {categories.map((category) => (
          <Link
            className={`
              group relative block h-[420px] overflow-hidden
              sm:h-[560px]
            `}
            href={categoryHref(category.slug)}
            key={category.id}
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
            <div
              className={`
                pointer-events-none absolute inset-0 bg-gradient-to-t
                from-black/75 via-black/10 to-transparent
              `}
            />
            <div className="absolute inset-x-0 bottom-0 p-10">
              <p className="krs-eyebrow text-krs-champagne">
                {category.productCount} pieces
              </p>
              <h3 className="mt-3 font-display text-3xl text-krs-ivory">
                {category.name}
              </h3>
              <p className="mt-2 max-w-xs text-sm text-krs-ivory/70">
                {category.description}
              </p>
            </div>
          </Link>
        ))}
      </section>

      {/* ------------------------------ KRS standard ------------------------------ */}
      <section className="bg-background py-20">
        <div
          className={`
            container mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4
            sm:px-6
            lg:grid-cols-[340px_1fr]
          `}
        >
          <div>
            <p className="krs-eyebrow text-krs-tobacco">The standard</p>
            <h2 className="mt-3 font-display text-3xl text-foreground">
              Four promises, no asterisks
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Every piece that leaves the salon carries the same set of
              commitments, whether it's a $2,000 strap or a six-figure
              complication.
            </p>
          </div>
          <div className={`
            grid grid-cols-1 gap-px bg-border
            sm:grid-cols-2
          `}>
            {STANDARD_PROMISES.map((promise) => (
              <div className="bg-background p-9" key={promise.n}>
                <p className="krs-meta text-krs-champagne">{promise.n}</p>
                <p className="mt-3 font-display text-lg text-foreground">
                  {promise.title}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {promise.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- Pull quote ------------------------------- */}
      {pullQuote && (
        <section className="bg-krs-ivory-bright py-24">
          <div
            className={`
              container mx-auto max-w-3xl px-6 text-center
              sm:px-10
            `}
          >
            <p className={`
              font-display text-2xl leading-[1.5] text-foreground
              sm:text-[34px]
            `}>
              “{pullQuote.quote}”
            </p>
            <p className="krs-eyebrow mt-8 text-krs-champagne">
              {pullQuote.customerName}
            </p>
          </div>
        </section>
      )}

      {/* --------------------------------- Account --------------------------------- */}
      <section className="bg-krs-mocha py-16">
        <div
          className={`
            container mx-auto flex max-w-7xl flex-col items-start gap-6 px-4
            sm:px-6
            lg:flex-row lg:items-center lg:justify-between
          `}
        >
          <div>
            <h2 className={`
              font-display text-2xl text-krs-ivory
              sm:text-3xl
            `}>
              {homepageSettings.ctaTitle}
            </h2>
            <p className="mt-2 max-w-md text-krs-ivory/70">
              {homepageSettings.ctaDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={homepageSettings.ctaPrimaryHref}>
              <Button
                className={`
                  h-[52px] rounded-none bg-krs-champagne px-8 text-xs
                  font-semibold tracking-[0.2em] text-krs-mocha uppercase
                  hover:bg-krs-champagne-light
                `}
              >
                {homepageSettings.ctaPrimaryText}
              </Button>
            </Link>
            <Link href={homepageSettings.ctaSecondaryHref}>
              <Button
                className={`
                  h-[52px] rounded-none border-krs-ivory/45 bg-transparent px-8
                  text-xs font-semibold tracking-[0.2em] text-krs-ivory
                  uppercase
                  hover:bg-white/10
                `}
                variant="outline"
              >
                {homepageSettings.ctaSecondaryText}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
