import type { Testimonial } from "~/db/schema";

interface TestimonialShowcaseProps {
  testimonials: Testimonial[];
}

/** Renders up to 3 real testimonials. Degrades gracefully: 1 renders as a single centered pull-quote, 0 renders nothing. */
export function TestimonialShowcase({
  testimonials,
}: TestimonialShowcaseProps) {
  const items = testimonials.slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section className="bg-krs-ivory-bright py-24">
      <div
        className={`
          container mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 text-center
          sm:px-10
          ${items.length > 1 ? "md:grid-cols-3" : "max-w-3xl"}
        `}
      >
        {items.map((item) => (
          <div key={item.id}>
            <p
              className={`
                font-display leading-[1.5] text-foreground
                ${items.length === 1 ? `
                  text-2xl
                  sm:text-[34px]
                ` : "text-xl"}
              `}
            >
              &ldquo;{item.quote}&rdquo;
            </p>
            <p className="krs-eyebrow mt-6 text-krs-champagne">
              {item.customerName}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
