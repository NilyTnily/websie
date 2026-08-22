import "dotenv/config";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "playwright";
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

const REMAINING_BRANDS = [
  "tudor", "vacheron-constantin", "cartier", "richard-mille", "breitling",
  "jaeger-lecoultre", "breguet", "piaget", "chopard", "hublot", "zenith",
  "iwc-schaffhausen", "panerai"
];

function parsePrice(t: string) { const m = t.match(/[\d,]+/); return m ? parseInt(m[0].replace(/,/g,"")) : null; }
function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""); }
async function delay(ms: number) { return new Promise(r=>setTimeout(r,ms)); }
async function waitCF(page: Page) {
  for(let i=0;i<30;i++){ const t=await page.title(), u=page.url(); if(!t.includes("Just a moment")&&!u.includes("__cf_chl")){await delay(500);return} await delay(2000) }
  throw new Error("CF timeout");
}
function mapSpec(k: string, v: string, s: WatchSpecs) {
  switch(k){case"reference":s.reference=v;break;case"casesize":s.caseSize=v;break;case"casematerial":s.caseMaterial=v;break;
  case"dialcolor":case"dialfinish":s.dialColor=v;break;case"movement":s.movement=v;break;case"caliber":s.caliber=v;break;
  case"powerreserve":s.powerReserve=v;break;case"waterresistance":s.waterResistance=v;break;case"strapmaterial":s.strapMaterial=v;break;
  case"strapcolor":case"buckletype":s.buckleType=v;break;case"style":s.style=v;break;case"specialfeatures":s.specialFeatures=v;break;
  case"complications":s.complications=v;break;case"dateadded":s.dateAdded=v;break;}
}

async function scrapeBrand(page: Page, brandSlug: string, brandName: string, maxWatches = 40): Promise<ScrapedWatch[]> {
  console.log(`\n=== ${brandName} (max ${maxWatches}) ===`);
  const out: ScrapedWatch[] = [];
  let pageNum = 1, hasMore = true, collected = 0;

  while (hasMore && collected < maxWatches) {
    const url = getBrandWatchesUrl(brandSlug, pageNum);
    console.log(`  Page ${pageNum}: ${url}`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await waitCF(page);
      const links = await page.$$eval("a[href^='/watches/']", ls =>
        ls.map(a=>a.getAttribute("href")).filter((h):h is string=>!!h&&h.startsWith("/watches/")&&
          !h.match(/^\/watches\/(all|mens|womens|automatic|quartz|classic|sporty|chrono|diving|pilot|new)/)&&!h.includes("/page-"))
      );
      const uniq = [...new Set(links)];
      console.log(`    Found ${uniq.length} links`);
      if (!uniq.length) { hasMore = false; break; }
      for (const link of uniq) {
        if (collected >= maxWatches) break;
        const full = link.startsWith("http")?link:`${BASE_URL}${link}`;
        console.log(`    [${collected+1}/${maxWatches}] ${full}`);
        const w = await scrapeWatch(page, full, brandSlug, brandName);
        if (w) { out.push(w); collected++; }
        await delay(1500);
      }
      const nextBtn = await page.$("a:has-text('Next'), a[rel='next'], .pagination a:has-text('Next')");
      if (!nextBtn || pageNum > 20) hasMore = false;
      else { pageNum++; await delay(2000); }
    } catch(e) { console.error(`  Page ${pageNum} error:`, e); hasMore = false; }
  }
  return out;
}

async function scrapeWatch(page: Page, url: string, bs: string, bn: string): Promise<ScrapedWatch|null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await waitCF(page);
    const name = (await page.locator("h1").first().textContent()||"").trim(); if(!name) return null;
    const slug = url.split("/watches/")[1]?.replace(/\/$/,"") || slugify(name);
    let price: number|null = null;
    const jsonLd = await page.locator('script[type="application/ld+json"]').all();
    for(const s of jsonLd){ try{ const c=await s.textContent(); if(c){ const d=JSON.parse(c); if(d.offers?.price){price=parseFloat(d.offers.price);break} if(Array.isArray(d)&&d[0]?.offers?.price){price=parseFloat(d[0].offers.price);break} }}catch{} }
    if(!price){ const pt = await page.locator(".price, [class*='price']").first().textContent(); if(pt) price=parsePrice(pt); }
    const specs: WatchSpecs = {};
    const tables = await page.locator("table, .wp-block-table").all();
    for(const t of tables){ const rs = await t.locator("tr").all();
      for(const r of rs){ const th=(await r.locator("th, td:first-child").first().textContent()||"").trim();
        const td=(await r.locator("td:last-child, td:nth-child(2)").first().textContent()||"").trim();
        if(th&&td) mapSpec(th.toLowerCase().replace(/[^a-z]+/g,""), td, specs);
      }
    }
    const images: WatchImage[] = []; let so=0;
    const imgs = await page.locator("img[src*='cdn.thewatchpages.com/app/uploads']").all();
    for(const img of imgs){
      const src = (await img.getAttribute("src")) || (await img.getAttribute("data-src")) || "";
      const alt = (await img.getAttribute("alt")) || "";
      if(src && !src.includes("logo") && (alt.toLowerCase().includes(name.toLowerCase().split(" ")[0]) || alt.includes("Image"))){
        images.push({url:src.split("?")[0], alt:alt||`${name} Image ${so+1}`, sortOrder:so++});
      }
    }
    images.sort((a,b)=>a.sortOrder-b.sortOrder);
    return {brandSlug:bs, brandName:bn, name, slug, url, price, specs, images, mainImage:images[0]?.url||""};
  } catch(e) { console.error(`  Err ${url}:`, e); return null; }
}

async function downloadImage(u: string, op: string) {
  try{ const r=await fetch(u); if(!r.ok) throw new Error(`HTTP ${r.status}`); await fs.writeFile(op, Buffer.from(await r.arrayBuffer())); return true; }
  catch(e){ console.error(`  DL fail ${u}:`, e); return false; }
}

async function main() {
  const browser = await chromium.launch({headless:true, args:["--disable-blink-features=AutomationControlled"]});
  const ctx = await browser.newContext({userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", viewport:{width:1920,height:1080}});
  const page = await ctx.newPage();
  await page.route("**/*", r=>["font","media","stylesheet","image"].includes(r.request().resourceType())?r.abort():r.continue());

  const od = path.join(process.cwd(),"scraped-data"), id = path.join(od,"images");
  await fs.mkdir(od,{recursive:true}); await fs.mkdir(id,{recursive:true});

  let all: ScrapedWatch[] = [];
  try { const d=await fs.readFile(path.join(od,"watches.json"),"utf-8"); all=JSON.parse(d); } catch {}

  const done = new Set(all.map(w=>w.brandSlug));
  for (const b of REMAINING_BRANDS) {
    if (done.has(b)) { console.log(`Skipping ${b} (done)`); continue; }
    const brand = CURRENT_BRANDS.find(x=>x.slug===b)!;
    const ws = await scrapeBrand(page, b, brand.name, 40);
    for (const w of ws) {
      all.push(w);
      for (const img of w.images) {
        const ext = path.extname(img.url).split("?")[0] || ".jpg";
        await downloadImage(img.url, path.join(id, `${w.slug}-${img.sortOrder}${ext}`));
      }
    }
    await fs.writeFile(path.join(od,"watches.json"), JSON.stringify(all,null,2));
    console.log(`  ${brand.name}: ${ws.length} watches (total ${all.length})`);
  }
  console.log(`\nDONE: ${all.length} total watches`);
  await browser.close();
}
main().catch(console.error);