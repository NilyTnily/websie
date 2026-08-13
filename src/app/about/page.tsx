import type { Metadata } from "next";

import { BadgeCheck, Gem, ShieldCheck, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SEO_CONFIG } from "~/app";
import { BLUR_DATA_URL } from "~/lib/image-placeholder";
import { Button } from "~/ui/primitives/button";

const ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1633451238042-85d93d267866?w=1600&auto=format&fit=crop&q=80";

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
      <section className="relative overflow-hidden">
        <div className="relative aspect-[16/7] w-full">
          <Image
            alt="Close-up of a watch movement's gears and components"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover"
            fill
            placeholder="blur"
            priority
            sizes="100vw"
            src={ABOUT_IMAGE}
          />
          <div
            className={`
              pointer-events-none absolute inset-0 bg-gradient-to-t
              from-black/70 via-black/10 to-transparent
            `}
          />
        </div>
        <div
          className={`
            absolute inset-x-0 bottom-0 px-6 pb-8
            sm:px-10
          `}
        >
          <div className="mx-auto max-w-7xl">
            <h1
              className={`
                font-display text-3xl text-white
                sm:text-4xl
              `}
            >
              About {SEO_CONFIG.name}
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/80">
              {SEO_CONFIG.slogan}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div
          className={`
            container mx-auto max-w-3xl px-4
            sm:px-6
          `}
        >
          <p className="text-lg leading-relaxed text-foreground">
            {SEO_CONFIG.description}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Every timepiece is cased and finished by hand, every stone is set
            one at a time, and every vintage piece in the archive has been
            sourced, authenticated, and restored under our own roof before it
            ever reaches the shelf. We are a small house on purpose — small
            enough that the person who services your movement or restrings your
            pearls is the same person who packed the box it arrived in.
          </p>
        </div>
      </section>

      <section
        className="border-y border-border bg-muted/40 py-16"
        id="standard"
      >
        <div
          className={`
            container mx-auto max-w-7xl px-4
            sm:px-6
          `}
        >
          <h2
            className={`
              max-w-lg font-display text-3xl text-foreground
              sm:text-4xl
            `}
          >
            The KRS Standard
          </h2>
          <div
            className={`
              mt-10 grid grid-cols-1 gap-8
              sm:grid-cols-2
              lg:grid-cols-4
            `}
          >
            {standard.map((item) => (
              <div key={item.title}>
                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full
                    bg-primary/10 text-primary
                  `}
                >
                  {item.icon}
                </div>
                <h3 className="mt-4 text-base font-medium text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
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
                h-11 px-8 text-xs font-medium tracking-[0.15em] uppercase
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
