import { getCategoriesWithCounts } from "~/lib/queries/catalog";

import { CategoriesPageClient } from "./page.client";

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return <CategoriesPageClient categories={categories} />;
}
