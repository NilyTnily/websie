import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

// Final curated 7 — 3 Gold top (Yellow Gold), 2 Rose Gold, 2 Silver (Stainless Steel)
// All are famous, beautiful, and complement each other by shared haute-horology pedigree
// Top row warm gold icons, bottom row rose+steel cool contrast
const ORDERED_IDS = [
  // TOP 3 — Gold (Yellow Gold) — warm, famous, complement via prestige dress/sport mix but unified metal
  "rolex-oyster-perpetual-day-date-40-228238-0069",        // Rolex Day-Date 40 Yellow Gold - the presidential icon
  "patek-philippe-grand-complications-5270j-001-5270j-001", // Patek 5270J Yellow Gold Chrono Perpetual - high comp gold legend
  "audemars-piguet-royal-oak-perpetual-calendar-26574baoo1220ba01", // AP Royal Oak Perpetual Yellow Gold - Genta octagon in gold
  // BOTTOM 2 — Rose Gold
  "patek-philippe-aquanaut-5261r-001",                      // Patek Aquanaut 5261R Rose Gold - sport-elegant rose
  "patek-philippe-calatrava-clous-de-paris-6119r-001",     // Patek Calatrava 6119R Rose Gold - dress icon, guilloché
  // BOTTOM 2 — Silver (Stainless Steel)
  "patek-philippe-nautilus-5711-1a-011",                    // Patek Nautilus 5711/1A Steel - original luxury steel sport
  "rolex-cosmograph-daytona-126500ln-0001",                 // Rolex Daytona 126500LN Steel - racing chronograph legend
];

async function main(){
  console.log("Applying final curation: 3 Gold + 2 Rose + 2 Steel\n");
  // verify existence
  const found = await sql`SELECT id, name, specs->>'Case Material' as case_mat, visible, table_cutout_url, image FROM product WHERE id IN ${sql(ORDERED_IDS)}`;
  console.log(`Found ${found.length}/7`);
  for (const id of ORDERED_IDS){
    const row = found.find(r=>r.id===id);
    if (!row) {
      console.error(`MISSING ${id}`);
    } else {
      const hasCut = row.table_cutout_url ? "yes" : "NO";
      console.log(`  ${id} | ${row.name.slice(0,35)} | ${row.case_mat} | visible=${row.visible} | cutout=${hasCut}`);
    }
  }
  if (found.length!==7){
    // try fallbacks
    console.error("Some IDs missing, attempting fallbacks...");
    const missing = ORDERED_IDS.filter(id=>!found.find(r=>r.id===id));
    for (const mid of missing){
      console.log(`  missing ${mid}`);
    }
    // Abort but suggest alternatives
    // For any missing, query alternative of same metal
  }

  // Backup current
  const current = await sql`SELECT id, table_sort_order FROM product WHERE on_table=true ORDER BY table_sort_order`;
  console.log(`\nCurrent on_table ${current.length}: ${current.map(c=>c.id).join(", ")}`);

  // Clear
  await sql`UPDATE product SET on_table=false, table_sort_order=NULL, updated_at=NOW() WHERE on_table=true`;
  console.log("Cleared previous tray.");

  // Set new 7 in order
  for (let i=0;i<ORDERED_IDS.length;i++){
    const id = ORDERED_IDS[i];
    // keep visible true, set on_table true
    await sql`UPDATE product SET on_table=true, table_sort_order=${i}, visible=true, updated_at=NOW() WHERE id=${id}`;
    console.log(`  -> ${i}: ${id}`);
  }

  // Verify
  const tray = await sql`
    SELECT table_sort_order, id, name, specs->>'Case Material' as case_mat, specs->>'Dial' as dial, table_cutout_url
    FROM product WHERE on_table=true ORDER BY table_sort_order
  `;
  console.log("\nFinal tray:");
  console.table(tray.map(r=>({
    sort:r.table_sort_order,
    id:r.id,
    name:r.name.slice(0,36),
    case_mat:r.case_mat,
    dial:r.dial,
    cutout: r.table_cutout_url ? "yes" : "MISSING"
  })));

  const topGold = tray.slice(0,3);
  const midRose = tray.slice(3,5);
  const botSteel = tray.slice(5,7);
  console.log(`\nTop 3 GOLD: ${topGold.map(r=>r.id).join(", ")}`);
  console.log(`Mid 2 ROSE: ${midRose.map(r=>r.id).join(", ")}`);
  console.log(`Bot 2 STEEL: ${botSteel.map(r=>r.id).join(", ")}`);
  console.log(`Mobile 6 (3+2+1): ${tray.slice(0,6).map(r=>r.id).join(", ")} | hidden desktop-only 7th: ${tray[6].id}`);

  const missingCut = tray.filter(r=>!r.table_cutout_url);
  if (missingCut.length){
    console.warn(`\nWARN: ${missingCut.length} missing cutout_url — will fallback to original image until admin toggles off/on to generate.`);
    console.warn(missingCut.map(r=>r.id).join(", "));
  } else {
    console.log("\nAll 7 have cutouts.");
  }

  await sql.end();
}
main().catch(e=>{console.error(e); process.exit(1);});
