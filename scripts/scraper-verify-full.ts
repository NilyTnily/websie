import "dotenv/config";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Page } from "playwright";
import * as fs from "fs/promises";
import * as path from "path";
import { CURRENT_BRANDS, BASE_URL, getBrandWatchesUrl } from "./brand-mapping.ts";

chromium.use(StealthPlugin());

interface WatchSpecs {
  reference?: string; caseSize?: string; caseMaterial?: string; dialColor?: string;
  movement?: string; caliber?: string; powerReserve?: string; waterResistance?: string;
  strapMaterial?: string; buckleType?: string; style?: string; specialFeatures?: string;
  complications?: string; dateAdded?: string; price?: string;
}
interface WatchImage { url: string; alt: string; sortOrder: number; }
interface ScrapedWatch {
  brandSlug: string; brandName: string; name: string; slug: string; url: string;
  price: number | null; specs: WatchSpecs; images: WatchImage[]; mainImage: string;
}

function parsePrice(t: string) { const m = t.match(/[\d,]+/); return m ? parseInt(m[0].replace(/,/g, "")) : null; }
function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
async function waitCF(page: Page) {
  for (let i = 0; i < 30; i++) {
    const t = await page.title(), u = page.url();
    if (!t.includes("Just a moment") && !u.includes("__cf_chl")) { await delay(500); return; }
    await delay(2000);
  }
  throw new Error("CF timeout");
}
function mapSpec(k: string, v: string, s: WatchSpecs) {
  switch (k) {
    case "reference": s.reference = v; break; case "casesize": s.caseSize = v; break; case "casematerial": s.caseMaterial = v; break;
    case "dialcolor": case "dialfinish": s.dialColor = v; break; case "movement": s.movement = v; break; case "caliber": s.caliber = v; break;
    case "powerreserve": s.powerReserve = v; break; case "waterresistance": s.waterResistance = v; break; case "strapmaterial": s.strapMaterial = v; break;
    case "strapcolor": case "buckletype": s.buckleType = v; break; case "style": s.style = v; break; case "specialfeatures": s.specialFeatures = v; break;
    case "complications": s.complications = v; break; case "dateadded": s.dateAdded = v; break;
  }
}

async function scrapeWatch(page: Page, url: string, bs: string, bn: string): Promise<ScrapedWatch | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await waitCF(page);
    const name = (await page.locator("h1").first().textContent() || "").trim(); if (!name) return null;
    const slug = url.split("/watches/")[1]?.replace(/\/$/, "") || slugify(name);
    let price: number | null = null;
    const jsonLd = await page.locator('script[type="application/ld+json"]').all();
    for (const s of jsonLd) { try { const c = await s.textContent(); if (c) { const d = JSON.parse(c); if (d.offers?.price) { price = parseFloat(d.offers.price); break; } if (Array.isArray(d) && d[0]?.offers?.price) { price = parseFloat(d[0].offers.price); break; } } } catch {} }
    if (!price) { const pt = await page.locator(".price, [class*='price']").first().textContent(); if (pt) price = parsePrice(pt); }
    const specs: WatchSpecs = {};
    const tables = await page.locator("table, .wp-block-table").all();
    for (const t of tables) {
      const rs = await t.locator("tr").all();
      for (const r of rs) {
        const th = (await r.locator("th, td:first-child").first().textContent() || "").trim();
        const td = (await r.locator("td:last-child, td:nth-child(2)").first().textContent() || "").trim();
        if (th && td) mapSpec(th.toLowerCase().replace(/[^a-z]+/g, ""), td, specs);
      }
    }
    const images: WatchImage[] = []; let so = 0;
    const imgs = await page.locator("img[src*='cdn.thewatchpages.com/app/uploads']").all();
    for (const img of imgs) {
      const src = (await img.getAttribute("src")) || (await img.getAttribute("data-src")) || "";
      const alt = (await img.getAttribute("alt")) || "";
      if (src && !src.includes("logo") && (alt.toLowerCase().includes(name.toLowerCase().split(" ")[0]) || alt.includes("Image"))) {
        images.push({ url: src.split("?")[0], alt: alt || `${name} Image ${so + 1}`, sortOrder: so++ });
      }
    }
    images.sort((a, b) => a.sortOrder - b.sortOrder);
    return { brandSlug: bs, brandName: bn, name, slug, url, price, specs, images, mainImage: images[0]?.url || "" };
  } catch (e) { console.error(`  Err ${url}:`, e); return null; }
}

async function downloadImage(u: string, op: string) {
  try { const r = await fetch(u); if (!r.ok) throw new Error(`HTTP ${r.status}`); await fs.writeFile(op, Buffer.from(await r.arrayBuffer())); return true; }
  catch (e) { console.error(`  DL fail ${u}:`, e); return false; }
}

function slugFromHref(href: string): string {
  return href.replace(/^\/watches\//, "").replace(/\/$/, "");
}

async function scrapeBrandFull(
  page: Page,
  brandSlug: string,
  brandName: string,
  existingSlugs: Set<string>,
  onNew: (w: ScrapedWatch) => Promise<void>,
  maxPages: number,
  newCap: number,
): Promise<{ totalSeen: number; alreadyHad: number; newlyAdded: number; pages: number }> {
  console.log(`\n=== ${brandName} (maxPages=${maxPages}, newCap=${newCap}) ===`);
  let pageNum = 1;
  let totalSeen = 0, alreadyHad = 0, newlyAdded = 0;
  const seenThisRun = new Set<string>();

  while (pageNum <= maxPages && newlyAdded < newCap) {
    const url = getBrandWatchesUrl(brandSlug, pageNum);
    console.log(`  Page ${pageNum}/${maxPages}: ${url}`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await waitCF(page);
      const links = await page.$$eval("a[href^='/watches/']", ls =>
        ls.map(a => a.getAttribute("href")).filter((h): h is string => !!h && h.startsWith("/watches/") &&
          !h.match(/^\/watches\/(all|mens|womens|automatic|quartz|classic|sporty|chrono|diving|pilot|new)/) && !h.includes("/page-"))
      );
      const uniq = [...new Set(links)];
      console.log(`    Found ${uniq.length} links on page`);
      if (!uniq.length) break;

      let newOnThisPage = 0;
      for (const link of uniq) {
        if (newlyAdded >= newCap) break;
        const slug = slugFromHref(link);
        if (seenThisRun.has(slug)) continue;
        seenThisRun.add(slug);
        totalSeen++;
        if (existingSlugs.has(slug)) { alreadyHad++; continue; }
        const full = link.startsWith("http") ? link : `${BASE_URL}${link}`;
        console.log(`    NEW [${newlyAdded + 1}] ${full}`);
        const w = await scrapeWatch(page, full, brandSlug, brandName);
        if (w) {
          await onNew(w);
          existingSlugs.add(w.slug);
          newlyAdded++;
          newOnThisPage++;
        }
        await delay(1000);
      }
      console.log(`    Page ${pageNum} summary: ${uniq.length} seen, ${newOnThisPage} new`);
      pageNum++;
      await delay(1500);
    } catch (e) {
      console.error(`  Page ${pageNum} error:`, e);
      break;
    }
  }
  return { totalSeen, alreadyHad, newlyAdded, pages: pageNum - 1 };
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ["--disable-blink-features=AutomationControlled"] });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  await page.route("**/*", r => ["font", "media", "stylesheet", "image"].includes(r.request().resourceType()) ? r.abort() : r.continue());

  const od = path.join(process.cwd(), "scraped-data"), id = path.join(od, "images");
  await fs.mkdir(od, { recursive: true }); await fs.mkdir(id, { recursive: true });

  let all: ScrapedWatch[] = [];
  try { const d = await fs.readFile(path.join(od, "watches.json"), "utf-8"); all = JSON.parse(d); } catch {}

  const existingSlugs = new Set(all.map(w => w.slug));
  console.log(`Loaded ${all.length} existing records, ${existingSlugs.size} unique slugs`);

  // Real per-brand totals confirmed from the site's own page <title> tag
  // (e.g. "Rolex: 322 watches with prices"). 80 results per listing page.
  const REAL_TOTALS: Record<string, number> = {
    "rolex": 322,
    "patek-philippe": 278,
    "omega": 1941,
    "richard-mille": 182,
    "panerai": 331,
    "cartier": 32,
  };
  // How many NEW watches to add per brand this run. Infinity = get everything remaining.
  const NEW_CAPS: Record<string, number> = {
    "omega": 500,
  };
  const RESULTS_PER_PAGE = 80;

  const targetBrands = process.argv.slice(2).length
    ? process.argv.slice(2)
    : CURRENT_BRANDS.map(b => b.slug);

  const summary: Record<string, { totalSeen: number; alreadyHad: number; newlyAdded: number; pages: number }> = {};

  for (const slug of targetBrands) {
    const brand = CURRENT_BRANDS.find(b => b.slug === slug);
    if (!brand) { console.log(`Unknown brand slug: ${slug}`); continue; }

    const realTotal = REAL_TOTALS[slug];
    const maxPages = realTotal ? Math.ceil(realTotal / RESULTS_PER_PAGE) + 1 : 400;
    const newCap = NEW_CAPS[slug] ?? Infinity;

    const result = await scrapeBrandFull(page, brand.slug, brand.name, existingSlugs, async (w) => {
      all.push(w);
      for (const img of w.images) {
        const ext = path.extname(img.url).split("?")[0] || ".jpg";
        await downloadImage(img.url, path.join(id, `${w.slug}-${img.sortOrder}${ext}`));
      }
      await fs.writeFile(path.join(od, "watches.json"), JSON.stringify(all, null, 2));
    }, maxPages, newCap);

    summary[brand.name] = result;
    console.log(`\n${brand.name} DONE: seen=${result.totalSeen} alreadyHad=${result.alreadyHad} newlyAdded=${result.newlyAdded} pages=${result.pages}`);
    await fs.writeFile(path.join(od, "verify-summary.json"), JSON.stringify(summary, null, 2));
  }

  console.log("\n=== FINAL SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
}
main().catch(console.error);
