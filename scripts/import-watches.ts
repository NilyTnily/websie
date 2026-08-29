import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { inArray, sql, count } from "drizzle-orm";
import { productTable, productImageTable } from "../src/db/schema/catalog/tables.ts";
import * as fs from "fs/promises";
import * as path from "path";
import { CURRENT_BRANDS } from "./brand-mapping.ts";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not set");
}

const conn = postgres(process.env.DATABASE_URL);
const db = drizzle(conn, {
  schema: {
    productTable,
    productImageTable,
  }
});

interface ScrapedWatch {
  brandSlug: string;
  brandName: string;
  name: string;
  slug: string;
  url: string;
  price: number | null;
  specs: Record<string, string>;
  images: { url: string; alt: string; sortOrder: number }[];
  mainImage: string;
}

function extractCaseSize(specs: Record<string, string>): number | null {
  const cs = specs.caseSize;
  if (cs) {
    const match = cs.match(/(\d+(?:\.\d+)?)\s*mm/i);
    if (match) return Math.round(parseFloat(match[1]));
  }
  return null;
}

function extractWaterResistance(specs: Record<string, string>): number | null {
  const wr = specs.waterResistance;
  if (wr) {
    const match = wr.match(/(\d+)\s*m/i);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function buildFeatures(specs: Record<string, string>): string[] {
  const features: string[] = [];
  if (specs.movement) features.push(specs.movement);
  if (specs.caliber) features.push(`Calibre ${specs.caliber}`);
  if (specs.powerReserve) features.push(`${specs.powerReserve} power reserve`);
  if (specs.waterResistance) features.push(`${specs.waterResistance} water resistance`);
  if (specs.caseMaterial) features.push(`${specs.caseMaterial} case`);
  if (specs.specialFeatures) features.push(specs.specialFeatures);
  return features;
}

function buildSpecsObject(specs: Record<string, string>): Record<string, string> {
  const obj: Record<string, string> = {};
  if (specs.reference) obj.Reference = specs.reference;
  if (specs.caseSize) obj.Case = specs.caseSize;
  if (specs.caseMaterial) obj["Case Material"] = specs.caseMaterial;
  if (specs.dialColor) obj.Dial = specs.dialColor;
  if (specs.movement) obj.Movement = specs.movement;
  if (specs.caliber) obj.Calibre = specs.caliber;
  if (specs.powerReserve) obj["Power Reserve"] = specs.powerReserve;
  if (specs.waterResistance) obj["Water Resistance"] = specs.waterResistance;
  if (specs.strapMaterial) obj.Strap = specs.strapMaterial;
  if (specs.buckleType) obj.Buckle = specs.buckleType;
  if (specs.style) obj.Style = specs.style;
  if (specs.complications) obj.Complications = specs.complications;
  if (specs.dateAdded) obj["Date Added"] = specs.dateAdded;
  return obj;
}

async function main() {
  const dataPath = path.join(process.cwd(), "scraped-data", "watches.json");

  console.log("Loading scraped data...");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const watches: ScrapedWatch[] = JSON.parse(rawData);

  console.log(`Loaded ${watches.length} watches`);

  const watchSet = new Set(CURRENT_BRANDS.map(b => b.slug));
  const validWatches = watches.filter(w => watchSet.has(w.brandSlug));
  console.log(`Valid watches: ${validWatches.length}`);

  // Deduplicate by slug (same watch scraped multiple times) - keep first occurrence
  const seenSlugs = new Set<string>();
  const dedupedWatches: ScrapedWatch[] = [];
  for (const w of validWatches) {
    if (!seenSlugs.has(w.slug)) {
      seenSlugs.add(w.slug);
      dedupedWatches.push(w);
    }
  }
  console.log(`After dedup: ${dedupedWatches.length} (${validWatches.length - dedupedWatches.length} dupes removed)`);

  // 1. Delete existing watch products and images
  console.log("\n=== Deleting existing watch data ===");
  const watchSubcategoryIds = CURRENT_BRANDS.map(b => b.id);
  const existingProducts = await db.select({ id: productTable.id })
    .from(productTable)
    .where(inArray(productTable.subcategoryId, watchSubcategoryIds) as any);
  const productIds = existingProducts.map(p => p.id);

  if (productIds.length > 0) {
    console.log(`Deleting ${productIds.length} product images...`);
    await db.delete(productImageTable).where(inArray(productImageTable.productId, productIds) as any);
    console.log(`Deleting ${productIds.length} products...`);
    await db.delete(productTable).where(inArray(productTable.id, productIds) as any);
  }

  // 2. Build bulk insert data
  console.log("\n=== Building bulk insert data ===");
  const productRows: typeof productTable.$inferInsert[] = [];
  const imageRows: typeof productImageTable.$inferInsert[] = [];

  for (const watch of dedupedWatches) {
    const specs = watch.specs;
    const movement = (specs.movement || "").toLowerCase().includes("hand") || (specs.movement || "").toLowerCase().includes("manual")
      ? "Manual-Wind"
      : (specs.movement || "").toLowerCase().includes("quartz")
        ? "Quartz"
        : "Automatic";

    const caseMaterial = (specs.caseMaterial || "").toLowerCase().includes("gold") ? "Gold"
      : (specs.caseMaterial || "").toLowerCase().includes("platinum") ? "Platinum"
      : (specs.caseMaterial || "").toLowerCase().includes("titanium") ? "Titanium"
      : (specs.caseMaterial || "").toLowerCase().includes("ceramic") ? "Ceramic"
      : (specs.caseMaterial || "").toLowerCase().includes("carbon") ? "Carbon"
      : "Steel";

    const strapMaterial = (specs.strapMaterial || "").toLowerCase().includes("steel") || (specs.strapMaterial || "").toLowerCase().includes("metal") || (specs.strapMaterial || "").toLowerCase().includes("bracelet")
      ? "Steel"
      : (specs.strapMaterial || "").toLowerCase().includes("rubber") ? "Rubber"
      : (specs.strapMaterial || "").toLowerCase().includes("gold") ? "Gold"
      : "Leather";

    productRows.push({
      id: watch.slug,
      categoryId: "timepieces",
      subcategoryId: watch.brandSlug,
      name: watch.name,
      ref: specs.reference || watch.slug,
      price: watch.price || 0,
      description: `${watch.name} - ${specs.caliber || ""} ${specs.movement || ""}`.trim(),
      features: buildFeatures(specs),
      specs: buildSpecsObject(specs),
      image: watch.mainImage,
      caseMaterial,
      caseSizeMm: extractCaseSize(specs),
      movement,
      strapMaterial,
      waterResistanceM: extractWaterResistance(specs),
      inStock: true,
      featured: false,
    });

    if (watch.images.length > 1) {
      for (let idx = 1; idx < watch.images.length; idx++) {
        imageRows.push({
          id: `${watch.slug}-img-${idx}`,
          productId: watch.slug,
          url: watch.images[idx].url,
          mediaType: "image",
          sortOrder: watch.images[idx].sortOrder,
        });
      }
    }
  }

  console.log(`Product rows: ${productRows.length}, Image rows: ${imageRows.length}`);

  // 3. Bulk insert
  console.log("\n=== Bulk inserting ===");
  const BATCH = 500;
  for (let i = 0; i < productRows.length; i += BATCH) {
    const batch = productRows.slice(i, i + BATCH);
    await db.insert(productTable).values(batch).onConflictDoNothing();
    console.log(`  Inserted products ${Math.min(i + BATCH, productRows.length)}/${productRows.length}`);
  }

  for (let i = 0; i < imageRows.length; i += BATCH) {
    const batch = imageRows.slice(i, i + BATCH);
    await db.insert(productImageTable).values(batch).onConflictDoNothing();
    console.log(`  Inserted images ${Math.min(i + BATCH, imageRows.length)}/${imageRows.length}`);
  }

  const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(productTable);
  console.log(`\n=== Import Complete ===`);
  console.log(`Final product count: ${c}`);

  await conn.end();
  process.exit(0);
}

main().catch(async e => {
  console.error(e);
  await conn.end();
  process.exit(1);
});