import "dotenv/config";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "playwright";
import * as fs from "fs/promises";
import * as path from "path";
import { CURRENT_BRANDS, BASE_URL, getBrandWatchesUrl } from "./brand-mapping.ts";

chromium.use(StealthPlugin());

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
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCloudflare(page: Page): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const title = await page.title();
    const url = page.url();
    if (!title.includes("Just a moment") && !url.includes("__cf_chl")) {
      await delay(500);
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
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await waitForCloudflare(page);
      
      const watchLinks = await page.$$eval("a[href^='/watches/']", links => 
        links
          .map(a => a.getAttribute("href"))
          .filter((href): href is string => !!href && 
            href.startsWith("/watches/") && 
            !href.match(/^\/watches\/(all|mens|womens|automatic|quartz|classic|sporty|chrono|diving|pilot|new)/) &&
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
      
      const nextBtn = await page.$("a:has-text('Next'), a[rel='next'], .pagination a:has-text('Next')");
      if (!nextBtn || pageNum > 50) {
        hasMore = false;
      } else {
        pageNum++;
        await delay(2000);
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
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await waitForCloudflare(page);
    
    const name = await page.locator("h1").first().textContent() || "";
    if (!name.trim()) return null;
    
    const slug = url.split("/watches/")[1]?.replace(/\/$/, "") || slugify(name);
    
    let price: number | null = null;
    
    // Try JSON-LD for price first
    const jsonLd = await page.locator('script[type="application/ld+json"]').all();
    for (const script of jsonLd) {
      try {
        const content = await script.textContent();
        if (content) {
          const data = JSON.parse(content);
          if (data.offers?.price) {
            price = parseFloat(data.offers.price);
            break;
          }
          if (Array.isArray(data) && data[0]?.offers?.price) {
            price = parseFloat(data[0].offers.price);
            break;
          }
        }
      } catch {}
    }
    
    // Fallback: look for price in page text
    if (!price) {
      const priceText = await page.locator(".price, [class*='price'], .wp-block-price").first().textContent();
      if (priceText) price = parsePrice(priceText);
    }
    
    // Extract specs from "Technical Specifications" section
    const specs: WatchSpecs = {};
    
    // Try to find the specs section
    const specSection = page.locator("h2:has-text('Technical Specifications'), h3:has-text('Technical Specifications'), .technical-specs, .specs");
    if (await specSection.count() > 0) {
      // Look for dl/dt/dd or table structure
      const rows = await specSection.locator("+ dl dt, + dl dd, + table tr, + .wp-block-table tr, + div:has(strong)").all();
      
      // Try definition list
      const dts = await page.locator("dt").all();
      const dds = await page.locator("dd").all();
      for (let i = 0; i < Math.min(dts.length, dds.length); i++) {
        const key = (await dts[i].textContent() || "").trim().toLowerCase().replace(/[^a-z]+/g, "");
        const value = (await dds[i].textContent() || "").trim();
        mapSpec(key, value, specs);
      }
      
      // Try table rows
      const trs = await page.locator("table tr, .wp-block-table tr").all();
      for (const tr of trs) {
        const th = await tr.locator("th, td:first-child").first().textContent() || "";
        const td = await tr.locator("td:last-child, td:nth-child(2)").first().textContent() || "";
        if (th.trim() && td.trim()) {
          const key = th.trim().toLowerCase().replace(/[^a-z]+/g, "");
          mapSpec(key, td.trim(), specs);
        }
      }
    }
    
    // Also search all tables on page
    const allTables = await page.locator("table, .wp-block-table").all();
    for (const table of allTables) {
      const rows = await table.locator("tr").all();
      for (const row of rows) {
        const th = await row.locator("th, td:first-child").first().textContent() || "";
        const td = await row.locator("td:last-child, td:nth-child(2)").first().textContent() || "";
        if (th.trim() && td.trim()) {
          const key = th.trim().toLowerCase().replace(/[^a-z]+/g, "");
          mapSpec(key, td.trim(), specs);
        }
      }
    }
    
    // Extract gallery images - look for images with alt containing "Image" or watch name
    const images: WatchImage[] = [];
    let sortOrder = 0;
    
    // Gallery images typically have alt like "Watch Name - Image 1"
    const galleryImages = await page.locator("img[alt*='Image'], img[alt*='image'], figure img, .gallery img, .wp-block-gallery img").all();
    for (const img of galleryImages) {
      const src = await img.getAttribute("src") || await img.getAttribute("data-src") || "";
      const alt = await img.getAttribute("alt") || "";
      if (src && src.includes("app/uploads") && !src.includes("logo")) {
        const cleanSrc = src.split("?")[0];
        images.push({ url: cleanSrc, alt: alt || `${name} - Image ${sortOrder + 1}`, sortOrder: sortOrder++ });
      }
    }
    
    // Fallback: all cdn images that look like watch photos
    if (images.length === 0) {
      const allImages = await page.locator("img[src*='cdn.thewatchpages.com/app/uploads']").all();
      for (const img of allImages) {
        const src = await img.getAttribute("src") || await img.getAttribute("data-src") || "";
        const alt = await img.getAttribute("alt") || "";
        if (src && !src.includes("logo") && (alt.toLowerCase().includes(name.toLowerCase().split(" ")[0]) || alt.includes("Image"))) {
          const cleanSrc = src.split("?")[0];
          images.push({ url: cleanSrc, alt: alt || `${name} - Image ${sortOrder + 1}`, sortOrder: sortOrder++ });
        }
      }
    }
    
    // Sort images by sortOrder, ensure main image is first
    images.sort((a, b) => a.sortOrder - b.sortOrder);
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

function mapSpec(key: string, value: string, specs: WatchSpecs): void {
  switch (key) {
    case "reference": specs.reference = value; break;
    case "casesize": specs.caseSize = value; break;
    case "casematerial": specs.caseMaterial = value; break;
    case "dialcolor": case "dialfinish": specs.dialColor = value; break;
    case "movement": specs.movement = value; break;
    case "caliber": specs.caliber = value; break;
    case "powerreserve": specs.powerReserve = value; break;
    case "waterresistance": specs.waterResistance = value; break;
    case "strapmaterial": specs.strapMaterial = value; break;
    case "strapcolor": case "buckletype": specs.buckleType = value; break;
    case "style": specs.style = value; break;
    case "specialfeatures": specs.specialFeatures = value; break;
    case "complications": specs.complications = value; break;
    case "dateadded": specs.dateAdded = value; break;
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

async function loadProgress(outputDir: string): Promise<{ watches: ScrapedWatch[], completed: Set<string> }> {
  const watchesPath = path.join(outputDir, "watches.json");
  const progressPath = path.join(outputDir, "progress.json");
  
  let watches: ScrapedWatch[] = [];
  let completed = new Set<string>();
  
  try {
    const data = await fs.readFile(watchesPath, "utf-8");
    watches = JSON.parse(data);
    for (const w of watches) completed.add(w.url);
  } catch {}
  
  try {
    const progress = JSON.parse(await fs.readFile(progressPath, "utf-8"));
    if (progress.completedBrands) {
      for (const b of progress.completedBrands) completed.add(b);
    }
  } catch {}
  
  return { watches, completed };
}

async function saveProgress(outputDir: string, watches: ScrapedWatch[], completedBrands: string[]): Promise<void> {
  await fs.writeFile(
    path.join(outputDir, "watches.json"),
    JSON.stringify(watches, null, 2)
  );
  await fs.writeFile(
    path.join(outputDir, "progress.json"),
    JSON.stringify({ completedBrands, totalWatches: watches.length, timestamp: new Date().toISOString() }, null, 2)
  );
}

async function main() {
  const brandArg = process.argv[2];
  const brandsToScrape = brandArg ? CURRENT_BRANDS.filter(b => b.slug === brandArg) : CURRENT_BRANDS;
  
  if (brandsToScrape.length === 0) {
    console.error(`Brand not found: ${brandArg}`);
    process.exit(1);
  }
  
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-site-isolation-trials"
    ]
  });
  
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
    timezoneId: "America/New_York",
  });
  
  const page = await context.newPage();
  
  await page.route("**/*", route => {
    const type = route.request().resourceType();
    if (["font", "media", "stylesheet", "image"].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });
  
  const outputDir = path.join(process.cwd(), "scraped-data");
  const imagesDir = path.join(outputDir, "images");
  
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(imagesDir, { recursive: true });
  
  const { watches: allWatches, completed } = await loadProgress(outputDir);
  console.log(`Resuming: ${allWatches.length} watches already scraped`);
  
  for (const brand of brandsToScrape) {
    if (completed.has(brand.slug)) {
      console.log(`\n=== Skipping ${brand.name} (already done) ===`);
      continue;
    }
    
    console.log(`\n=== Scraping ${brand.name} (${brand.slug}) ===`);
    
    const watchUrls = await scrapeBrandListing(page, brand.slug);
    console.log(`  Found ${watchUrls.length} watches`);
    
    for (let i = 0; i < watchUrls.length; i++) {
      const watchUrl = watchUrls[i];
      if (completed.has(watchUrl)) {
        console.log(`  [${i + 1}/${watchUrls.length}] Skipping (already done)`);
        continue;
      }
      
      console.log(`  [${i + 1}/${watchUrls.length}] ${watchUrl}`);
      
      const watch = await scrapeWatchDetail(page, watchUrl, brand.slug, brand.name);
      if (watch) {
        allWatches.push(watch);
        completed.add(watchUrl);
        
        for (const img of watch.images) {
          const ext = path.extname(img.url).split("?")[0] || ".jpg";
          const filename = `${watch.slug}-${img.sortOrder}${ext}`;
          const outputPath = path.join(imagesDir, filename);
          await downloadImage(img.url, outputPath);
        }
      }
      
      // Save progress every 5 watches
      if ((i + 1) % 5 === 0) {
        await saveProgress(outputDir, allWatches, Array.from(completed).filter(c => CURRENT_BRANDS.some(b => c.startsWith(b.slug))));
      }
      
      await delay(1500);
    }
    
    completed.add(brand.slug);
    await saveProgress(outputDir, allWatches, Array.from(completed).filter(c => CURRENT_BRANDS.some(b => c.startsWith(b.slug))));
    console.log(`  Completed ${brand.name}: ${watchUrls.length} watches`);
  }
  
  console.log(`\n=== Done! Total: ${allWatches.length} watches ===`);
  console.log(`Data saved to ${outputDir}/watches.json`);
  console.log(`Images saved to ${imagesDir}/`);
  
  await browser.close();
}

main().catch(console.error);