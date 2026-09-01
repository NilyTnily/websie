import dynamic from "next/dynamic";

import { isAdminEmail } from "~/lib/admin";
import { getCurrentUser } from "~/lib/auth";
import {
  getCategoriesWithCounts,
  getFeaturedProducts,
  getProductCount,
  getSubcategoriesWithCounts,
  getTableProducts,
} from "~/lib/queries/catalog";
import { getSiteSettings } from "~/lib/queries/settings";
import { CollectionSpotlight } from "~/ui/components/collection-spotlight";
import { toProductCardData } from "~/ui/components/featured-products-grid";
import { Footer } from "~/ui/components/footer";
import { Header } from "~/ui/components/header/header";
import { HomeHeroFlythroughGate } from "~/ui/components/home-hero-flythrough-gate";
import { HomeLoupeBand } from "~/ui/components/home-loupe-band";
import { HouseMarquee } from "~/ui/components/house-marquee";
import { NewPiecesCarousel } from "~/ui/components/new-pieces-carousel";
import { ShopByCategory } from "~/ui/components/shop-by-category";
import { ShopTheLook } from "~/ui/components/shop-the-look";

// LoupeStats is the only homepage component that pulls in framer-motion
// (for the count-up-on-scroll-into-view animation) — it's also well below
// the fold, so the framer-motion chunk has no business being in the
// initial homepage bundle. Deferred so it loads once this section is
// about to be scrolled into view instead of blocking first paint.
const LoupeStats = dynamic(
  () => import("~/ui/components/loupe-stats").then((m) => m.LoupeStats),
  {
    loading: () => <div className="mt-8 h-[76px]" />,
  },
);

export default async function HomePage() {
  const [tableProducts, featuredProducts, categories, subcategories, productCount, settings, user] =
    await Promise.all([
      getTableProducts(),
      getFeaturedProducts(),
      getCategoriesWithCounts(),
      getSubcategoriesWithCounts(),
      getProductCount(),
      getSiteSettings(),
      getCurrentUser(),
    ]);
  const houses = subcategories.map((subcategory) => subcategory.name);
  const isAdmin = isAdminEmail(user?.email);
  // Mapped once here, server-side — the client components below only ever
  // receive this flattened shape, never the full ProductWithRelations
  // (nested images[]/category/subcategory/model), so nothing unused rides
  // along in the client bundle.
  const featuredCards = featuredProducts.map(toProductCardData);

  return (
    <>
      <Header
        isAdmin={isAdmin}
        showAuth={true}
        user={user && { email: user.email, image: user.image, name: user.name }}
      />
      <HomeHeroFlythroughGate
        className="h-[calc(100dvh-var(--header-height))] w-full bg-krs-onyx"
        tableProducts={tableProducts}
      />

      <section
        className={`
          container mx-auto max-w-7xl px-4 py-24
          sm:px-6
        `}
      >
        <p className="krs-eyebrow text-center text-krs-tobacco">
          Fresh from the case
        </p>
        <h2
          className={`
            mt-3 text-center font-display text-3xl text-foreground
            sm:text-4xl
          `}
        >
          New pieces
        </h2>
        <div className="mt-12">
          <NewPiecesCarousel products={featuredCards} />
        </div>
      </section>

      <CollectionSpotlight
        body={settings.collectionSpotlightBody}
        ctaLabel={settings.collectionSpotlightCtaLabel}
        eyebrow={settings.collectionSpotlightEyebrow}
        href={settings.collectionSpotlightHref}
        imageUrl={settings.collectionSpotlightImageUrl}
        title={settings.collectionSpotlightTitle}
      />

      <ShopByCategory categories={categories} />

      <HouseMarquee houses={houses} />

      <section
        className={`
          container mx-auto max-w-7xl px-4 py-24
          sm:px-6
        `}
      >
        <p className="krs-eyebrow text-center text-krs-tobacco">
          Under the loupe
        </p>
        <h2
          className={`
            mt-3 text-center font-display text-3xl text-foreground
            sm:text-4xl
          `}
        >
          Every complication, considered
        </h2>
        <div className="mx-auto mt-12 max-w-3xl">
          <HomeLoupeBand
            alt="A watch movement magnified under a jeweler's loupe"
            src="/hero-flythrough/scene3-desktop.webp"
          />
          <LoupeStats productCount={productCount} />
        </div>
      </section>

      <ShopTheLook products={featuredCards} />

      <Footer />
    </>
  );
}
