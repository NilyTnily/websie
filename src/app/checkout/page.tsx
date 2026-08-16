import { CheckoutClient } from "./checkout-client";

export const metadata = {
  title: "Checkout — KRS",
};

export default function CheckoutPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <CheckoutClient />
    </main>
  );
}
