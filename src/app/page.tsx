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
import { buildWhatsAppLink } from "~/lib/whatsapp";
import { FeaturedShelfGrid } from "~/ui/components/featured-shelf-grid";
import { HomeHeroVideo } from "~/ui/components/home-hero-video";
import { HomeLoupeBand } from "~/ui/components/home-loupe-band";
import { HouseMarquee } from "~/ui/components/house-marquee";
import { LoupeStats } from "~/ui/components/loupe-stats";
import { Reveal } from "~/ui/components/reveal";
import { TestimonialShowcase } from "~/ui/components/testimonial-showcase";
import { WorkshopTeaser } from "~/ui/components/workshop-teaser";
import { Button } from "~/ui/primitives/button";

const WATCHES_CATEGORY_SLUG = "timepieces";

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
  const viewingLink = await buildWhatsAppLink("I'd like to book a viewing.");
  const inFrameHouse = inFramePiece?.subcategory?.name;
  const inFrameMaterial = inFramePiece?.caseMaterial ?? inFramePiece?.metal;

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
          <HomeHeroVideo
            className="absolute inset-0 h-full w-full"
            poster={heroVideoPoster}
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
              <p className="krs-eyebrow text-krs-champagne">
                Fine watches &amp; jewelry
              </p>
              <h1
                className={`
                  mt-6 font-display text-4xl leading-[1.06] font-normal
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
              <div className="mt-8 flex flex-wrap gap-3.5">
                <Link href={homepageSettings.heroCtaHref}>
                  <Button
                    className={`
                      h-[52px] rounded-none bg-krs-champagne px-[34px] text-xs
                      font-semibold tracking-[0.22em] text-krs-mocha uppercase
                      hover:bg-krs-champagne-light
                    `}
                  >
                    {homepageSettings.heroCtaText}
                  </Button>
                </Link>
                {viewingLink && (
                  <a
                    className={`
                      flex h-[52px] items-center border border-krs-ivory/45
                      px-[34px] text-xs font-medium tracking-[0.22em]
                      text-krs-ivory uppercase
                      hover:border-krs-champagne hover:text-krs-champagne
                    `}
                    href={viewingLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Book a viewing
                  </a>
                )}
              </div>
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
              <p className="krs-meta mt-1.5 text-krs-ivory/60">
                {[
                  inFrameHouse,
                  inFrameMaterial && inFramePiece.caseSizeMm
                    ? `${inFrameMaterial} ${inFramePiece.caseSizeMm}mm`
                    : inFrameMaterial,
                  CURRENCY_FORMATTER.format(inFramePiece.price),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Link>
          )}
        </div>
      </section>

      {/* ---------------------------- House marquee ------------------------------ */}
      <HouseMarquee houses={houses.map((h) => h.name)} />

      {/* ------------------------------ Current shelf ----------------------------- */}
      <section className="py-20">
        <Reveal
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
        </Reveal>
      </section>

      {/* ---------------------------- Under the loupe ----------------------------- */}
      <section className="bg-krs-onyx py-24">
        <Reveal
          className={`
            container mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4
            sm:px-6
            lg:grid-cols-[1.1fr_.9fr] lg:gap-[72px]
          `}
        >
          {inFramePiece && (
            <HomeLoupeBand
              alt={inFramePiece.name}
              src={inFramePiece.image}
            />
          )}
          <div className="flex flex-col justify-center">
            <p className="krs-eyebrow text-krs-champagne">Under the loupe</p>
            <h2
              className={`
                mt-3 font-display text-3xl leading-[1.2] text-krs-ivory
                sm:text-4xl
              `}
            >
              See it the way we grade it
            </h2>
            <p className="mt-4 max-w-md text-krs-ivory/70">
              Every listing carries a 10× loupe view of the dial, the
              hallmark and the setting. Not a marketing crop — the same
              magnification our watchmaker uses on the bench before a piece
              is allowed on the shelf.
            </p>
            <LoupeStats productCount={productCount} />
          </div>
        </Reveal>
      </section>

      {/* ------------------------------ Workshop teaser ---------------------------- */}
      <Reveal>
        <WorkshopTeaser />
      </Reveal>

      {/* -------------------------------- Two houses ------------------------------ */}
      <Reveal>
      <section
        className={`
          grid grid-cols-1
          sm:grid-cols-2
        `}
      >
        {categories.map((category) => {
          const isWatches = category.slug === WATCHES_CATEGORY_SLUG;
          return (
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
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(13,13,13,.8), rgba(13,13,13,.05) 60%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-12">
                <p className="krs-eyebrow text-krs-champagne">
                  {isWatches
                    ? `${houses.length} houses`
                    : `${category.productCount} pieces`}
                </p>
                <h3 className={`
                  mt-3 font-display text-[40px] tracking-[0.05em] text-krs-ivory
                `}>
                  {category.name}
                </h3>
                <p className={`
                  mt-2 max-w-xs text-sm font-light text-krs-ivory/75
                `}>
                  {category.description}
                </p>
              </div>
            </Link>
          );
        })}
      </section>
      </Reveal>

      {/* ------------------------------ KRS standard ------------------------------ */}
      <section className="bg-background py-20">
        <Reveal
          className={`
            container mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4
            sm:px-6
            lg:grid-cols-[340px_1fr]
          `}
        >
          <div>
            <p className="krs-eyebrow text-krs-tobacco">The KRS standard</p>
            <h2 className="mt-3 font-display text-3xl text-foreground">
              Four promises, no asterisks
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              We are a small house on purpose — small enough that the
              person who services your movement is the same person who
              packed the box it arrived in.
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
        </Reveal>
      </section>

      {/* -------------------------------- Testimonials ------------------------------- */}
      <Reveal>
        <TestimonialShowcase testimonials={testimonials} />
      </Reveal>

      {/* --------------------------------- Account --------------------------------- */}
      <section className="bg-krs-mocha py-16">
        <Reveal
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
        </Reveal>
      </section>
    </main>
  );
}
