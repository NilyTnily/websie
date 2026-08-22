import Image from "next/image";
import Link from "next/link";

/** Homepage editorial teaser for the workshop story — a shorter pull of the About page's craftsmanship copy, not a duplicate of it, linking through for the full story. */
export function WorkshopTeaser() {
  return (
    <section className="py-24">
      <div
        className={`
          container mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4
          sm:px-6
          lg:grid-cols-2 lg:gap-20
        `}
      >
        <div className="relative">
          <div className="relative aspect-[4/5]">
            <Image
              alt="A watchmaker servicing a movement at the bench"
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 70vw, 35vw"
              src="https://images.unsplash.com/photo-1725960103635-0a6709f97126?q=80&w=1000&auto=format&fit=crop"
            />
          </div>
          <div
            className={`
              relative mt-10 aspect-[4/5] max-w-[70%]
              sm:ml-auto
            `}
          >
            <Image
              alt="A hand holding a jeweler's hand tool"
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 49vw, 25vw"
              src="https://images.unsplash.com/photo-1628058494685-6c2f796ac24a?q=80&w=1000&auto=format&fit=crop"
            />
          </div>
        </div>
        <div>
          <p className="krs-eyebrow text-krs-tobacco">In the workshop</p>
          <h2
            className={`
              mt-3 font-display text-3xl text-foreground
              sm:text-4xl
            `}
          >
            One roof, start to finish
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Every timepiece is cased and finished by hand here, not shipped
            out to a third party. The same person who grades a movement
            under the loupe is the one who&apos;ll service it years from
            now.
          </p>
          <Link
            className={`
              krs-eyebrow mt-8 inline-flex items-center gap-2 text-krs-champagne
              hover:text-krs-champagne-light
            `}
            href="/about"
          >
            Read our story →
          </Link>
        </div>
      </div>
    </section>
  );
}
