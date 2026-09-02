import { getAllProducts } from "~/lib/queries/catalog";
import { getWhatsAppContactCount } from "~/lib/queries/contacts";

import { NewArrivalsPageClient } from "./page.client";

export const maxDuration = 60;

export default async function AdminNewArrivalsPage() {
  const [allProducts, contactCount] = await Promise.all([
    getAllProducts(),
    getWhatsAppContactCount().catch(() => 0),
  ]);

  return <NewArrivalsPageClient contactCount={contactCount} products={allProducts} />;
}
