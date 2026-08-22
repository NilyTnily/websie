import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { productTable, productImageTable, subcategoryTable } from "../src/db/schema/catalog/tables.ts";
import { eq, inArray } from "drizzle-orm";
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
    subcategoryTable,
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

interface WatchSpecs {
  reference?: string;
  caseSize?: string;
  caseMaterial?: string;
  dialColor?: string;
  movement?: string;
  caliber?: string;
  powerReserve?: string;
  waterResistance?: string;
  strapMaterial?: string;
  buckleType?: string;
  style?: string;
  specialFeatures?: string;
  complications?: string;
  dateAdded?: string;
  price?: string;
}

function extractCaseSize(specs: WatchSpecs): number | null {
  if (specs.caseSize) {
    const match = specs.caseSize.match(/(\d+(?:\.\d+)?)\s*mm/i);
    if (match) return Math.round(parseFloat(match[1]));
  }
  return null;
}

function extractWaterResistance(specs: WatchSpecs): number | null {
  if (specs.waterResistance) {
    const match = specs.waterResistance.match(/(\d+)\s*m/i);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function buildFeatures(specs: WatchSpecs): string[] {
  const features: string[] = [];
  if (specs.movement) features.push(specs.movement);
  if (specs.caliber) features.push(`Calibre ${specs.caliber}`);
  if (specs.powerReserve) features.push(`${specs.powerReserve} power reserve`);
  if (specs.waterResistance) features.push(`${specs.waterResistance} water resistance`);
  if (specs.caseMaterial) features.push(`${specs.caseMaterial} case`);
  if (specs.specialFeatures) features.push(specs.specialFeatures);
  return features;
}

function buildSpecsObject(specs: WatchSpecs): Record<string, string> {
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
  
  // 1. Delete existing watch products and images
  console.log("\n=== Deleting existing watch data ===");
  
  const watchSubcategoryIds = CURRENT_BRANDS.map(b => b.id);
  const existingProducts = await db.select({ id: productTable.id })
    .from(productTable)
    .where(inArray(productTable.subcategoryId, watchSubcategoryIds));
  
  const productIds = existingProducts.map(p => p.id);
  
  if (productIds.length > 0) {
    console.log(`Deleting ${productIds.length} product images...`);
    await db.delete(productImageTable).where(inArray(productImageTable.productId, productIds));
    
    console.log(`Deleting ${productIds.length} products...`);
    await db.delete(productTable).where(inArray(productTable.id, productIds));
  }
  
  // 2. Insert new products
  console.log("\n=== Inserting new watches ===");
  
  let inserted = 0;
  let skipped = 0;
  
  for (const watch of watches) {
    const subcategoryId = watch.brandSlug;
    const brand = CURRENT_BRANDS.find(b => b.slug === watch.brandSlug);
    
    if (!brand) {
      console.log(`  Skipping ${watch.name}: brand not found`);
      skipped++;
      continue;
    }
    
    const specs = watch.specs as WatchSpecs;
    const caseSizeMm = extractCaseSize(specs);
    const waterResistanceM = extractWaterResistance(specs);
    const features = buildFeatures(specs);
    const specsObj = buildSpecsObject(specs);
    
    let movement = "Automatic";
    if (specs.movement?.toLowerCase().includes("hand") || specs.movement?.toLowerCase().includes("manual")) {
      movement = "Manual-Wind";
    } else if (specs.movement?.toLowerCase().includes("quartz")) {
      movement = "Quartz";
    }
    
    let caseMaterial = "Steel";
    if (specs.caseMaterial?.toLowerCase().includes("gold")) caseMaterial = "Gold";
    else if (specs.caseMaterial?.toLowerCase().includes("platinum")) caseMaterial = "Platinum";
    else if (specs.caseMaterial?.toLowerCase().includes("titanium")) caseMaterial = "Titanium";
    else if (specs.caseMaterial?.toLowerCase().includes("ceramic")) caseMaterial = "Ceramic";
    else if (specs.caseMaterial?.toLowerCase().includes("carbon")) caseMaterial = "Carbon";
    
    let strapMaterial = "Leather";
    if (specs.strapMaterial?.toLowerCase().includes("steel") || specs.strapMaterial?.toLowerCase().includes("metal") || specs.strapMaterial?.toLowerCase().includes("bracelet")) {
      strapMaterial = "Steel";
    } else if (specs.strapMaterial?.toLowerCase().includes("rubber")) {
      strapMaterial = "Rubber";
    } else if (specs.strapMaterial?.toLowerCase().includes("gold")) {
      strapMaterial = "Gold";
    }
    
    const productData = {
      id: watch.slug,
      categoryId: "timepieces",
      subcategoryId,
      name: watch.name,
      ref: specs.reference || watch.slug,
      price: watch.price || 0,
      description: `${watch.name} - ${specs.caliber || ""} ${specs.movement || ""}`.trim(),
      features,
      specs: specsObj,
      image: watch.mainImage,
      caseMaterial,
      caseSizeMm,
      movement,
      strapMaterial,
      waterResistanceM,
      inStock: true,
      featured: false,
    };
    
    try {
      await db.insert(productTable).values(productData).onConflictDoNothing();
      inserted++;
      
      if (watch.images.length > 1) {
        const imageRows = watch.images.slice(1).map((img, idx) => ({
          id: `${watch.slug}-img-${idx}`,
          productId: watch.slug,
          url: img.url,
          mediaType: "image" as const,
          sortOrder: img.sortOrder,
        }));
        
        if (imageRows.length > 0) {
          await db.insert(productImageTable).values(imageRows).onConflictDoNothing();
        }
      }
      
      if (inserted % 25 === 0) {
        console.log(`  Inserted ${inserted} watches...`);
      }
    } catch (error) {
      console.error(`  Error inserting ${watch.name}:`, error);
      skipped++;
    }
  }
  
  console.log(`\n=== Import Complete ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total processed: ${watches.length}`);
  
  await conn.end();
  process.exit(0);
}

main().catch(async e => {
  console.error(e);
  await conn.end();
  process.exit(1);
});