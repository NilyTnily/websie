"use client";

import { Facebook, Instagram } from "lucide-react";
import Link from "next/link";

import { cn } from "~/lib/cn";
import { useSiteSettings } from "~/lib/hooks/use-site-settings";
import { Button } from "~/ui/primitives/button";

export function Footer({ className }: { className?: string }) {
  const settings = useSiteSettings();

  return (
    <footer className={cn("bg-krs-navy text-krs-navy-foreground", className)}>
      <div
        className={`
          container mx-auto max-w-7xl px-4 py-12
          sm:px-6
          lg:px-8
        `}
      >
        <div
          className={`
            grid grid-cols-1 gap-8
            md:grid-cols-4
          `}
        >
          <div className="space-y-4">
            <Link className="flex items-center gap-2" href="/">
              <span className="font-display text-xl tracking-wide">
                {settings.name}
              </span>
            </Link>
            <p className="text-sm text-krs-navy-foreground/70">
              Fine watches and jewelry, serviced in-house and shipped insured.
              Nothing on the shelf is made twice.
            </p>
            {(settings.instagramUrl || settings.facebookUrl) && (
              <div className="flex space-x-2">
                {settings.instagramUrl && (
                  <Button
                    asChild
                    className={`
                      h-8 w-8 rounded-full text-krs-navy-foreground
                      hover:bg-white/10 hover:text-primary
                    `}
                    size="icon"
                    variant="ghost"
                  >
                    <a
                      href={settings.instagramUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </a>
                  </Button>
                )}
                {settings.facebookUrl && (
                  <Button
                    asChild
                    className={`
                      h-8 w-8 rounded-full text-krs-navy-foreground
                      hover:bg-white/10 hover:text-primary
                    `}
                    size="icon"
                    variant="ghost"
                  >
                    <a
                      href={settings.facebookUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Facebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
          <div>
            <h3 className={`krs-ref mb-4 text-xs text-krs-navy-foreground/50`}>
              Collections
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className={`
                    text-krs-navy-foreground/80
                    hover:text-primary
                  `}
                  href="/products"
                >
                  All Pieces
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-krs-navy-foreground/80
                    hover:text-primary
                  `}
                  href="/watches"
                >
                  Watches
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-krs-navy-foreground/80
                    hover:text-primary
                  `}
                  href="/jewelry"
                >
                  Jewelry
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={`krs-ref mb-4 text-xs text-krs-navy-foreground/50`}>
              The House
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className={`
                    text-krs-navy-foreground/80
                    hover:text-primary
                  `}
                  href="/about"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-krs-navy-foreground/80
                    hover:text-primary
                  `}
                  href="/about#standard"
                >
                  The KRS Standard
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-krs-navy-foreground/80
                    hover:text-primary
                  `}
                  href="/auth/sign-up"
                >
                  Client Account
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={`krs-ref mb-4 text-xs text-krs-navy-foreground/50`}>
              Care
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-krs-navy-foreground/80">
                  Resizing &amp; restringing — complimentary
                </span>
              </li>
              <li>
                <span className="text-krs-navy-foreground/80">
                  Movement service — in-house
                </span>
              </li>
              <li>
                <span className="text-krs-navy-foreground/80">
                  Shipping — insured, signature required
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-krs-navy-border pt-8">
          <div
            className={`
              flex flex-col items-center justify-between gap-4
              md:flex-row
            `}
          >
            <p className="text-sm text-krs-navy-foreground/60">
              &copy; {new Date().getFullYear()} {settings.name}. All rights
              reserved.
            </p>
            <div
              className={`
                flex items-center gap-4 text-sm text-krs-navy-foreground/60
              `}
            >
              <Link className="hover:text-primary" href="/privacy">
                Privacy
              </Link>
              <Link className="hover:text-primary" href="/terms">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
