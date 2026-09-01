import Image from "next/image";
import Link from "next/link";

interface CollectionSpotlightProps {
  body?: null | string;
  ctaLabel?: null | string;
  eyebrow?: null | string;
  href?: null | string;
  imageUrl?: null | string;
  title?: null | string;
}

/** Homepage's single full-bleed collection banner — KRS's answer to a "featured collection" spotlight, but pointed at the house standard rather than an invented seasonal collection by default. Every field is admin-editable (Settings → Homepage — Collection Spotlight); unset fields fall back to that default KRS Standard framing. */
export function CollectionSpotlight({
  body,
  ctaLabel,
  eyebrow,
  href,
  imageUrl,
  title,
}: CollectionSpotlightProps) {
  return (
    <section className="relative overflow-hidden">
      <div className={`
        relative aspect-[16/9] w-full
        sm:aspect-[21/9]
      `}>
        <Image
          alt={title ?? "A watch movement laid open on the bench"}
          className="object-cover"
          fill
          sizes="100vw"
          src={imageUrl || "/hero-flythrough/scene4-desktop.webp"}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-krs-onyx/55"
        />
        <div className={`
          absolute inset-0 flex items-center justify-center px-6 text-center
        `}>
          <div className="max-w-xl">
            <p className="krs-eyebrow text-krs-champagne">
              {eyebrow || "The KRS standard"}
            </p>
            <h2
              className={`
                mt-3 font-display text-3xl text-krs-ivory
                sm:text-5xl
              `}
            >
              {title || "Every piece, held to one bar"}
            </h2>
            <p className={`
              mt-4 text-sm text-krs-ivory/75
              sm:text-base
            `}>
              {body ||
                "Graded under the loupe, serviced in-house, and fitted before it ever leaves the bench — no exceptions made for the shelf."}
            </p>
            <Link
              className={`
                krs-eyebrow mt-8 inline-flex items-center gap-2
                text-krs-champagne
                hover:text-krs-champagne-light
              `}
              href={href || "/about#standard"}
            >
              {ctaLabel || "See the standard"} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
