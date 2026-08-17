import "dotenv/config";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs/promises";
import * as path from "path";
import { CURRENT_BRANDS, THEWATCHPAGES_BRAND_MAP, BASE_URL, getBrandWatchesUrl } from "./brand-mapping.js";

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

const axiosInstance = axios.create({
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  },
  timeout: 30000,
  maxRedirects: 5,
});

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchHtml(url: string): Promise<string> {
  const response = await axiosInstance.get(url);
  return response.data;
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

async function scrapeBrandListing(brandSlug: string): Promise<string[]> {
  const watchUrls: string[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = getBrandWatchesUrl(brandSlug, page);
    console.log(`  Scraping page ${page}: ${url}`);
    
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      
      const watchLinks = $("a[href^='/watches/']").map((_, el) => $(el).attr("href")).get();
      const uniqueLinks = [...new Set(watchLinks)];
      
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
      
      const nextPage = $("a:contains('Next'), a[rel='next'], .pagination a").first();
      if (nextPage.length === 0 || page > 50) {
        hasMore = false;
      } else {
        page++;
        await delay(1000);
      }
    } catch (error) {
      console.error(`  Error scraping page ${page}:`, error);
      hasMore = false;
    }
  }
  
  return watchUrls;
}

async function scrapeWatchDetail(url: string, brandSlug: string, brandName: string): Promise<ScrapedWatch | null> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    
    const name = $("h1").first().text().trim();
    if (!name) return null;
    
    const slug = url.split("/watches/")[1]?.replace(/\/$/, "") || slugify(name);
    
    let price: number | null = null;
    const priceText = $("*:contains('$')").first().text();
    if (priceText) {
      price = parsePrice(priceText);
    }
    
    const specs: WatchSpecs = {};
    $(".wp-block-table table tr, table tr, .specs tr, .technical-specs tr").each((_, row) => {
      const th = $(row).find("th, td:first-child").text().trim();
      const td = $(row).find("td:last-child, td:nth-child(2)").text().trim();
      if (th && td) {
        const key = th.toLowerCase().replace(/[^a-z]+/g, "");
        switch (key) {
          case "reference": specs.reference = td; break;
          case "casesize": specs.caseSize = td; break;
          case "casematerial": specs.caseMaterial = td; break;
          case "dialcolor": specs.dialColor = td; break;
          case "movement": specs.movement = td; break;
          case "caliber": specs.caliber = td; break;
          case "powerreserve": specs.powerReserve = td; break;
          case "waterresistance": specs.waterResistance = td; break;
          case "strapmaterial": specs.strapMaterial = td; break;
          case "buckletype": specs.buckleType = td; break;
          case "style": specs.style = td; break;
          case "specialfeatures": specs.specialFeatures = td; break;
          case "complications": specs.complications = td; break;
          case "dateadded": specs.dateAdded = td; break;
        }
      }
    });
    
    const images: WatchImage[] = [];
    let sortOrder = 0;
    
    $("img[src*='cdn.thewatchpages.com']").each((_, img) => {
      const src = $(img).attr("src") || $(img).attr("data-src") || "";
      const alt = $(img).attr("alt") || "";
      if (src && (src.includes("app/uploads") || src.includes("watch")) && !src.includes("logo")) {
        const cleanSrc = src.split("?")[0];
        images.push({ url: cleanSrc, alt, sortOrder: sortOrder++ });
      }
    });
    
    const mainImage = images[0]?.url || "";
    
    return {
      brandSlug,
      brandName,
      name,
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
    const response = await axiosInstance.get(url, { responseType: "arraybuffer" });
    await fs.writeFile(outputPath, response.data);
    return true;
  } catch (error) {
    console.error(`    Failed to download ${url}:`, error);
    return false;
  }
}

async function scrapeAllBrands() {
  const allWatches: ScrapedWatch[] = [];
  const outputDir = path.join(process.cwd(), "scraped-data");
  const imagesDir = path.join(outputDir, "images");
  
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(imagesDir, { recursive: true });
  
  for (const brand of CURRENT_BRANDS) {
    console.log(`\n=== Scraping ${brand.name} (${brand.slug}) ===`);
    
    const watchUrls = await scrapeBrandListing(brand.slug);
    console.log(`  Found ${watchUrls.length} watches`);
    
    for (let i = 0; i < watchUrls.length; i++) {
      const watchUrl = watchUrls[i];
      console.log(`  [${i + 1}/${watchUrls.length}] ${watchUrl}`);
      
      const watch = await scrapeWatchDetail(watchUrl, brand.slug, brand.name);
      if (watch) {
        allWatches.push(watch);
        
        for (const img of watch.images) {
          const ext = path.extname(img.url).split("?")[0] || ".jpg";
          const filename = `${watch.slug}-${img.sortOrder}${ext}`;
          const outputPath = path.join(imagesDir, filename);
          await downloadImage(img.url, outputPath);
        }
      }
      
      await delay(500);
    }
  }
  
  await fs.writeFile(
    path.join(outputDir, "watches.json"),
    JSON.stringify(allWatches, null, 2)
  );
  
  console.log(`\n=== Done! Scraped ${allWatches.length} watches ===`);
  console.log(`Data saved to ${outputDir}/watches.json`);
  console.log(`Images saved to ${imagesDir}/`);
}

scrapeAllBrands().catch(console.error);