import type { Metadata } from "next";

import { SEO_CONFIG } from "~/app";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SEO_CONFIG.fullName}`,
};

export default function PrivacyPage() {
  return (
    <div
      className={`
        container mx-auto max-w-3xl px-4 py-16
        sm:px-6
        lg:px-8
      `}
    >
      <h1 className="font-display text-4xl text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {new Date().getFullYear()}
      </p>

      <div
        className={`
          mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground
        `}
      >
        <section>
          <h2 className="mb-2 font-display text-lg text-foreground">
            Information we collect
          </h2>
          <p>
            When you create a {SEO_CONFIG.name} account or place an order, we
            collect the information you provide directly — your name, email
            address, shipping address, and order history. If you sign in with a
            third-party provider, we receive the basic profile details that
            provider shares with us.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-foreground">
            How we use it
          </h2>
          <p>
            We use your information to process and ship orders, authenticate
            your account, provide customer support, and communicate about your
            purchases. We do not sell your personal information to third
            parties.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-foreground">
            Payments
          </h2>
          <p>
            Payments are processed by our third-party payment provider.{" "}
            {SEO_CONFIG.name} does not store your full payment card details on
            our own servers.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-foreground">
            Your rights
          </h2>
          <p>
            You can access, update, or request deletion of your account data at
            any time from your dashboard, or by contacting us directly.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-foreground">Contact</h2>
          <p>
            Questions about this policy can be sent to our support team through
            your account dashboard.
          </p>
        </section>
      </div>
    </div>
  );
}
