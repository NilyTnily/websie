import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api"],
      userAgent: "*",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
