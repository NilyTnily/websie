import type { Metadata } from "next";

import { BadgeCheck, Gem, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";

import { SEO_CONFIG } from "~/app";
import { ImageFallback } from "~/ui/components/image-fallback";
import { Button } from "~/ui/primitives/button";

const standard = [
  {
    description:
      "Every automatic and hand-wound movement is serviced by our own workshop, not shipped out to a third party.",
    icon: <Wrench className="h-5 w-5" />,
    title: "Serviced In-House",
  },
  {
    description:
      "Metal is hallmarked, stones are graded, and vintage pieces ship with a written provenance dossier.",
    icon: <BadgeCheck className="h-5 w-5" />,
    title: "Hallmarked & Authenticated",
  },
  {
    description:
      "Every order ships insured, signature-required, in a fitted presentation case — no exceptions.",
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Insured White-Glove Shipping",
  },
  {
    description:
      "Resizing, restringing, and cleaning are free for the life of the piece. Bring it back whenever it needs it.",
    icon: <Gem className="h-5 w-5" />,
    title: "Lifetime Care",
  },
];

export const metadata: Metadata = {
  description: SEO_CONFIG.description,
  title: `About Us — ${SEO_CONFIG.fullName}`,
};

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero — empty image slot pending real workshop photography. */}
      <section className={`
        relative h-[420px] overflow-hidden
        sm:h-[620px]
      `}>
        <ImageFallback />
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
            <p className="krs-eyebrow text-krs-champagne">About the house</p>
            <h1
              className={`
                mt-4 font-display text-4xl text-krs-ivory
                sm:text-[66px]
              `}
            >
              Small on purpose
            </h1>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div
          className={`
            container mx-auto grid max-w-7xl grid-cols-1 gap-11 px-4
            sm:px-6
            lg:grid-cols-2 lg:gap-[88px]
          `}
        >
          <div>
            <p className={`
              font-display text-2xl text-foreground
              sm:text-[26px]
            `}>
              {SEO_CONFIG.description}
            </p>
            <p className="mt-6 text-base leading-[1.9] text-muted-foreground">
              Every timepiece is cased and finished by hand, every stone is set
              one at a time, and every vintage piece in the archive has been
              sourced, authenticated, and restored under our own roof before it
              ever reaches the shelf. We are a small house on purpose — small
              enough that the person who services your movement or restrings your
              pearls is the same person who packed the box it arrived in.
            </p>
          </div>

          {/* Two empty image slots pending real workshop photography (bench, stone setting). */}
          <div className="relative">
            <div className="relative aspect-[3/4]">
              <ImageFallback />
            </div>
            <div className={`
              relative mt-12 aspect-[3/4] max-w-[80%]
              sm:ml-auto
            `}>
              <ImageFallback />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-krs-mocha py-16" id="standard">
        <div
          className={`
            container mx-auto max-w-7xl px-4
            sm:px-6
          `}
        >
          <div
            className={`
              grid grid-cols-1 gap-px bg-krs-champagne/25
              sm:grid-cols-2
              lg:grid-cols-4
            `}
          >
            {standard.map((item) => (
              <div className="bg-krs-mocha p-8" key={item.title}>
                <div className="text-krs-champagne">{item.icon}</div>
                <h3 className="mt-4 text-base font-medium text-krs-ivory">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-krs-ivory/70">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div
          className={`
            container mx-auto flex max-w-7xl flex-col items-center gap-6 px-4
            py-8 text-center
            sm:px-6
          `}
        >
          <h2
            className={`
              max-w-xl font-display text-3xl text-foreground
              sm:text-4xl
            `}
          >
            Questions before you buy?
          </h2>
          <p className="max-w-md text-muted-foreground">
            Write to us with a reference number or a question about a movement,
            a stone, or a piece of provenance — a real person who works the
            bench will answer.
          </p>
          <Link href="/products">
            <Button
              className={`
                h-11 rounded-none px-8 text-xs font-medium tracking-[0.15em]
                uppercase
              `}
              variant="outline"
            >
              Browse the Collection
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
