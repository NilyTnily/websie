// Watches and Jewelry have their own dedicated landing pages; any category
// added later (via /admin/categories) deep-links into the catalog instead.
const CATEGORY_LANDING_PAGES: Record<string, string> = {
  "fine-jewelry": "/jewelry",
  timepieces: "/watches",
};

export function categoryHref(slug: string): string {
  return CATEGORY_LANDING_PAGES[slug] ?? `/products?category=${slug}`;
}
