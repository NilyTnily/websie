import "dotenv/config";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
import * as fs from "fs/promises";
import * as path from "path";
import { CURRENT_BRANDS, BASE_URL, getBrandWatchesUrl } from "./brand-mapping.ts";

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

interface WatchImage {
  url: string;
  alt: string;
  sortOrder: number;
}

interface ScrapedWatch {
  brandSlug: string;
  brandName: string;
  name: string;
  slug: string;
  url: string;
  price: number | null;
  specs: WatchSpecs;
  images: WatchImage[];
  mainImage: string;
}

function parsePrice(priceText: string): number | null {
  const match = priceText.match(/[\d,]+/);
  if (match) {
    return parseInt(match[0].replace(/,/g, ""), 10);
  }
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCloudflare(page: Page): Promise<void> {
  // Wait for Cloudflare challenge to complete
  for (let i = 0; i < 30; i++) {
    const title = await page.title();
    const url = page.url();
    if (!title.includes("Just a moment") && !url.includes("__cf_chl")) {
      return;
    }
    await delay(2000);
  }
  throw new Error("Cloudflare challenge timeout");
}

async function scrapeBrandListing(page: Page, brandSlug: string): Promise<string[]> {
  const watchUrls: string[] = [];
  let pageNum = 1;
  let hasMore = true;

  while (hasMore) {
    const url = getBrandWatchesUrl(brandSlug, pageNum);
    console.log(`  Scraping page ${pageNum}: ${url}`);
    
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      await waitForCloudflare(page);
      
      // Check if page has watches
      const watchLinks = await page.$$eval("a[href^='/watches/']", links => 
        links
          .map(a => a.getAttribute("href"))
          .filter((href): href is string => !!href && 
            href.startsWith("/watches/") && 
            !href.match(/^\/watches\/(all|mens|womens|automatic|quartz|classic|sporty|chrono|diving|pilot)/) &&
            !href.includes("/page-")
          ) as string[]
      );
      
      const uniqueLinks = [...new Set(watchLinks)];
      console.log(`    Found ${uniqueLinks.length} watch links`);
      
      if (uniqueLinks.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const link of uniqueLinks) {
        const fullUrl = link.startsWith("http") ? link : `${BASE_URL}${link}`;
        if (!watchUrls.includes(fullUrl)) {
          watchUrls.push(fullUrl);
        }
      }
      
      // Check for next page
      const nextBtn = await page.$("a:has-text('Next'), a[rel='next'], .pagination a:has-text('Next')");
      if (!nextBtn || pageNum > 50) {
        hasMore = false;
      } else {
        pageNum++;
        await delay(1500);
      }
    } catch (error) {
      console.error(`  Error scraping page ${pageNum}:`, error);
      hasMore = false;
    }
  }
  
  return watchUrls;
}

async function scrapeWatchDetail(page: Page, url: string, brandSlug: string, brandName: string): Promise<ScrapedWatch | null> {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await waitForCloudflare(page);
    
    const name = await page.locator("h1").first().textContent() || "";
    if (!name.trim()) return null;
    
    const slug = url.split("/watches/")[1]?.replace(/\/$/, "") || slugify(name);
    
    // Get price
    let price: number | null = null;
    const priceElements = await page.locator("*:has-text('$')").all();
    for (const el of priceElements) {
      const text = await el.textContent();
      if (text && text.includes("$")) {
        price = parsePrice(text);
        if (price) break;
      }
    }
    
    // Get specs from tables
    const specs: WatchSpecs = {};
    const tables = await page.locator("table, .wp-block-table, .specs, .technical-specs").all();
    for (const table of tables) {
      const rows = await table.locator("tr").all();
      for (const row of rows) {
        const th = await row.locator("th, td:first-child").first().textContent() || "";
        const td = await row.locator("td:last-child, td:nth-child(2)").first().textContent() || "";
        if (th.trim() && td.trim()) {
          const key = th.toLowerCase().replace(/[^a-z]+/g, "");
          switch (key) {
            case "reference": specs.reference = td.trim(); break;
            case "casesize": specs.caseSize = td.trim(); break;
            case "casematerial": specs.caseMaterial = td.trim(); break;
            case "dialcolor": specs.dialColor = td.trim(); break;
            case "movement": specs.movement = td.trim(); break;
            case "caliber": specs.caliber = td.trim(); break;
            case "powerreserve": specs.powerReserve = td.trim(); break;
            case "waterresistance": specs.waterResistance = td.trim(); break;
            case "strapmaterial": specs.strapMaterial = td.trim(); break;
            case "buckletype": specs.buckleType = td.trim(); break;
            case "style": specs.style = td.trim(); break;
            case "specialfeatures": specs.specialFeatures = td.trim(); break;
            case "complications": specs.complications = td.trim(); break;
            case "dateadded": specs.dateAdded = td.trim(); break;
          }
        }
      }
    }
    
    // Get all images from gallery
    const images: WatchImage[] = [];
    let sortOrder = 0;
    
    // Main gallery images
    const imgElements = await page.locator("img[src*='cdn.thewatchpages.com']").all();
    for (const img of imgElements) {
      const src = await img.getAttribute("src") || await img.getAttribute("data-src") || "";
      const alt = await img.getAttribute("alt") || "";
      if (src && (src.includes("app/uploads") || src.includes("/watches/")) && !src.includes("logo")) {
        const cleanSrc = src.split("?")[0];
        images.push({ url: cleanSrc, alt: alt || name, sortOrder: sortOrder++ });
      }
    }
    
    const mainImage = images[0]?.url || "";
    
    return {
      brandSlug,
      brandName,
      name: name.trim(),
      slug,
      url,
      price,
      specs,
      images,
      mainImage,
    };
  } catch (error) {
    console.error(`  Error scraping ${url}:`, error);
    return null;
  }
}

async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error(`    Failed to download ${url}:`, error);
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"]
  });
  
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  // Block unnecessary resources to speed up
  await page.route("**/*", route => {
    const type = route.request().resourceType();
    if (["font", "media", "stylesheet"].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });
  
  const allWatches: ScrapedWatch[] = [];
  const outputDir = path.join(process.cwd(), "scraped-data");
  const imagesDir = path.join(outputDir, "images");
  
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(imagesDir, { recursive: true });
  
  for (const brand of CURRENT_BRANDS) {
    console.log(`\n=== Scraping ${brand.name} (${brand.slug}) ===`);
    
    const watchUrls = await scrapeBrandListing(page, brand.slug);
    console.log(`  Found ${watchUrls.length} watches`);
    
    for (let i = 0; i < watchUrls.length; i++) {
      const watchUrl = watchUrls[i];
      console.log(`  [${i + 1}/${watchUrls.length}] ${watchUrl}`);
      
      const watch = await scrapeWatchDetail(page, watchUrl, brand.slug, brand.name);
      if (watch) {
        allWatches.push(watch);
        
        // Download images
        for (const img of watch.images) {
          const ext = path.extname(img.url).split("?")[0] || ".jpg";
          const filename = `${watch.slug}-${img.sortOrder}${ext}`;
          const outputPath = path.join(imagesDir, filename);
          await downloadImage(img.url, outputPath);
        }
      }
      
      await delay(800);
    }
  }
  
  await fs.writeFile(
    path.join(outputDir, "watches.json"),
    JSON.stringify(allWatches, null, 2)
  );
  
  console.log(`\n=== Done! Scraped ${allWatches.length} watches ===`);
  console.log(`Data saved to ${outputDir}/watches.json`);
  console.log(`Images saved to ${imagesDir}/`);
  
  await browser.close();
}

main().catch(console.error);