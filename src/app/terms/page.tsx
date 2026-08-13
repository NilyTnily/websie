import type { Metadata } from "next";

import { SEO_CONFIG } from "~/app";

export const metadata: Metadata = {
  title: `Terms of Service — ${SEO_CONFIG.fullName}`,
};

export default function TermsPage() {
  return (
    <div
      className={`
        container mx-auto max-w-3xl px-4 py-16
        sm:px-6
        lg:px-8
      `}
    >
      <h1 className="font-display text-4xl text-foreground">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {new Date().getFullYear()}
      </p>

      <div
        className={`
          mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground
        `}
      >
        <section>
          <h2 className="mb-2 font-display text-lg text-foreground">Orders</h2>
          <p>
            By placing an order with {SEO_CONFIG.name}, you confirm that the
            shipping and payment information you provide is accurate. Prices are
            listed in USD and are subject to change without notice until an
            order is confirmed.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-foreground">
            Authentication
          </h2>
          <p>
            Pieces are described and, where noted, authenticated to the best of
            our ability at the time of listing. Vintage pieces ship with a
            written provenance dossier where available.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-foreground">
            Shipping
          </h2>
          <p>
            All shipments are insured and require a signature on delivery. Risk
            of loss passes to you once a shipment is delivered and signed for.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-foreground">
            Account use
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity under your account.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-foreground">Changes</h2>
          <p>
            We may update these terms from time to time. Continued use of the
            site after changes are posted constitutes acceptance of the revised
            terms.
          </p>
        </section>
      </div>
    </div>
  );
}
