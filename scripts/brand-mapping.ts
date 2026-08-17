import "dotenv/config";

// Current brands from watch-brands-data.ts
export const CURRENT_BRANDS = [
  { id: "patek-philippe", name: "Patek Philippe", slug: "patek-philippe" },
  { id: "tudor", name: "Tudor", slug: "tudor" },
  { id: "omega", name: "Omega", slug: "omega" },
  { id: "vacheron-constantin", name: "Vacheron Constantin", slug: "vacheron-constantin" },
  { id: "cartier", name: "Cartier", slug: "cartier" },
  { id: "richard-mille", name: "Richard Mille", slug: "richard-mille" },
  { id: "breitling", name: "Breitling", slug: "breitling" },
  { id: "audemars-piguet", name: "Audemars Piguet", slug: "audemars-piguet" },
  { id: "jaeger-lecoultre", name: "Jaeger-LeCoultre", slug: "jaeger-lecoultre" },
  { id: "breguet", name: "Breguet", slug: "breguet" },
  { id: "piaget", name: "Piaget", slug: "piaget" },
  { id: "chopard", name: "Chopard L.U.C", slug: "chopard" },
  { id: "hublot", name: "Hublot", slug: "hublot" },
  { id: "zenith", name: "Zenith", slug: "zenith" },
  { id: "iwc-schaffhausen", name: "IWC Schaffhausen", slug: "iwc-schaffhausen" },
  { id: "panerai", name: "Panerai", slug: "panerai" },
  { id: "rolex", name: "Rolex", slug: "rolex" },
];

// thewatchpages.com brand URL mapping (some may differ from our slugs)
export const THEWATCHPAGES_BRAND_MAP: Record<string, string> = {
  "patek-philippe": "patek-philippe",
  "tudor": "tudor",
  "omega": "omega",
  "vacheron-constantin": "vacheron-constantin",
  "cartier": "cartier",
  "richard-mille": "richard-mille",
  "breitling": "breitling",
  "audemars-piguet": "audemars-piguet",
  "jaeger-lecoultre": "jaeger-lecoultre",
  "breguet": "breguet",
  "piaget": "piaget",
  "chopard": "chopard",
  "hublot": "hublot",
  "zenith": "zenith",
  "iwc-schaffhausen": "iwc-schaffhausen",
  "panerai": "panerai",
  "rolex": "rolex",
};

export const BASE_URL = "https://www.thewatchpages.com";

export function getBrandUrl(brandSlug: string): string {
  const mappedSlug = THEWATCHPAGES_BRAND_MAP[brandSlug] || brandSlug;
  return `${BASE_URL}/brands/${mappedSlug}`;
}

export function getBrandWatchesUrl(brandSlug: string, page = 1): string {
  const baseUrl = getBrandUrl(brandSlug);
  return page === 1 ? baseUrl : `${baseUrl}/page-${page}`;
}