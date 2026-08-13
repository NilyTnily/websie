import type { MetadataRoute } from "next";

import { getAllProducts } from "~/lib/queries/catalog";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { changeFrequency: "daily", priority: 1, url: BASE_URL },
    { changeFrequency: "daily", priority: 0.9, url: `${BASE_URL}/products` },
    { changeFrequency: "daily", priority: 0.9, url: `${BASE_URL}/watches` },
    { changeFrequency: "daily", priority: 0.9, url: `${BASE_URL}/jewelry` },
    { changeFrequency: "monthly", priority: 0.5, url: `${BASE_URL}/about` },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    changeFrequency: "weekly",
    lastModified: product.updatedAt,
    priority: 0.8,
    url: `${BASE_URL}/products/${product.id}`,
  }));

  return [...staticRoutes, ...productRoutes];
}
