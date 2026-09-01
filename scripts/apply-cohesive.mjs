import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

// Cohesive palette: similar colors within each row so neighbours compliment
// TOP 3 GOLD: all light dials (White/Silver/Opaline) + Yellow Gold case -> warm, elegant, similar
// ROSE 2: both light dials + Rose Gold -> warm but pinkish, pair
// STEEL 2: both dark dials (Blue/Black) + Stainless Steel -> cool, pair, both Nautilus family for max cohesion

const ORDERED_IDS = [
  // Top 3 Gold - light dials, Yellow Gold, compliment each other
  "patek-philippe-calatrava-5227j-001",              // Calatrava White/Yellow Gold - classic dress, light
  "rolex-oyster-perpetual-day-date-36-128238-0111",   // Day-Date 36 White/Yellow Gold (check exists, fallback to 128238-012)
  "patek-philippe-grand-complications-5270j-001-5270j-001", // 5270J Opaline/Yellow Gold

  // Bottom 2 Rose - light dials, Rose Gold, pair
  "patek-philippe-calatrava-5227r-001",              // Calatrava White/Rose Gold
  "patek-philippe-calatrava-clous-de-paris-6119r-001", // Calatrava Silver/Rose Gold

  // Bottom 2 Steel - dark dials, Steel, both Nautilus family => super cohesive pair
  "patek-philippe-nautilus-5711-1a-010",              // Nautilus Blue/Steel
  "patek-philippe-nautilus-5726a-001",                // Nautilus Black/Steel (Annual Calendar, complements blue)
];

async function checkIds(ids){
  const found = await sql`SELECT id, name, specs->>'Case Material' as cm, specs->>'Dial' as dial FROM product WHERE id IN ${sql(ids)}`;
  console.log(`Found ${found.length}/${ids.length}`);
  for (const id of ids){
    const r = found.find(x=>x.id===id);
    console.log(`${r ? "OK":"MISSING"} ${id} -> ${r ? r.name.slice(0,30)+` | ${r.cm}/${r.dial}` : ""}`);
  }
  return found;
}

let ids = ORDERED_IDS;
// Check existence, replace missing with alternative yellow white
let found = await checkIds(ids);
const missing = ids.filter(id=>!found.find(r=>r.id===id));
if (missing.length){
  console.log("Missing:", missing);
  // try alternatives
  const alts = await sql`SELECT id, name, specs->>'Case Material' as cm, specs->>'Dial' as dial FROM product WHERE specs->>'Case Material'='Yellow Gold' AND specs->>'Dial'='White' LIMIT 5`;
  console.table(alts.map(r=>({id:r.id, name:r.name.slice(0,30), dial:r.dial})));
  // replace missing with first alt not in list
  for (const m of missing){
    const replacement = alts.find(a=>!ids.includes(a.id));
    if (replacement){
      console.log(`Replacing ${m} with ${replacement.id}`);
      ids = ids.map(x=> x===m ? replacement.id : x);
    }
  }
  found = await checkIds(ids);
}

console.log("\nFinal cohesive IDs:", ids);

// Clear current
await sql`UPDATE product SET on_table=false, table_sort_order=NULL, updated_at=NOW() WHERE on_table=true`;
console.log("Cleared");

// Set new order
for (let i=0;i<ids.length;i++){
  await sql`UPDATE product SET on_table=true, table_sort_order=${i}, visible=true, updated_at=NOW() WHERE id=${ids[i]}`;
  console.log(`${i}: ${ids[i]}`);
}

// Set fallback cutout to image for now (will regenerate next)
const tray = await sql`SELECT id, image FROM product WHERE on_table=true`;
for (const r of tray){
  await sql`UPDATE product SET table_cutout_url=${r.image}, updated_at=NOW() WHERE id=${r.id}`;
}
console.log("Set fallback cutouts");

const verify = await sql`SELECT table_sort_order, id, name, specs->>'Case Material' as cm, specs->>'Dial' as dial FROM product WHERE on_table=true ORDER BY table_sort_order`;
console.table(verify.map(r=>({sort:r.table_sort_order, id:r.id, name:r.name.slice(0,32), cm:r.cm, dial:r.dial})));

await sql.end();
