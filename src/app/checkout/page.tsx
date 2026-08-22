import { redirect } from "next/navigation";

import { getSiteSettings } from "~/lib/queries/settings";

import { CheckoutClient } from "./checkout-client";

export const metadata = {
  title: "Checkout — KRS",
};

export default async function CheckoutPage() {
  const settings = await getSiteSettings();
  if (settings.noMoneyMode) redirect("/products");

  return (
    <main className="flex min-h-screen flex-col">
      <CheckoutClient />
    </main>
  );
}
