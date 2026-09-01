import "dotenv/config";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });

// 7 picks in exact tray order: 3 gold top, 2 rose, 2 steel bottom
const ORDERED_IDS = [
  "cartier-tank-louis",       // Top 1 - Gold Yellow
  "piaget-polo-79",           // Top 2 - Gold Yellow
  "patek-calatrava-6119",     // Top 3 - Gold White
  "chopard-luc-1860",         // Bottom 1 - Rose
  "breguet-tradition-7097",   // Bottom 2 - Rose
  "patek-nautilus-5711",      // Bottom 3 - Steel Silver
  "rolex-submariner-126610",  // Bottom 4 - Steel Silver (desktop only, hidden on mobile)
];

async function main() {
  console.log("Curating table tray...");

  // Verify all 7 exist
  const existing = await sql`SELECT id, name, metal, "case_material", "on_table", "table_sort_order", "visible", "table_cutout_url" FROM product WHERE id IN ${sql(ORDERED_IDS)}`;
  console.log(`Found ${existing.length}/7 target products:`);
  for (const id of ORDERED_IDS) {
    const row = existing.find(r => r.id === id);
    if (!row) {
      console.error(`  MISSING: ${id}`);
    } else {
      console.log(`  OK: ${id} | ${row.name} | metal=${row.metal} case=${row.case_material} visible=${row.visible} cutout=${row.table_cutout_url ? 'yes' : 'no'}`);
    }
  }
  if (existing.length !== 7) {
    console.error("ABORT: not all 7 IDs found - check watch-brands-data.ts IDs");
    await sql.end();
    process.exit(1);
  }

  // 1. Clear all on_table first
  const cleared = await sql`UPDATE product SET on_table = false, table_sort_order = NULL, updated_at = NOW() WHERE on_table = true RETURNING id`;
  console.log(`Cleared ${cleared.length} previously on-table products: ${cleared.map(r=>r.id).join(", ") || "(none)"}`);

  // 2. Set the 7 in order
  for (let i = 0; i < ORDERED_IDS.length; i++) {
    const id = ORDERED_IDS[i];
    await sql`UPDATE product SET on_table = true, table_sort_order = ${i}, visible = true, updated_at = NOW() WHERE id = ${id}`;
    console.log(`  Set ${id} -> on_table=true, sortOrder=${i}`);
  }

  // 3. Verify
  const result = await sql`
    SELECT id, name, metal, "case_material", on_table, table_sort_order, visible,
           CASE WHEN table_cutout_url IS NOT NULL AND table_cutout_url != '' THEN 'yes' ELSE 'NO' END as has_cutout
    FROM product
    WHERE on_table = true
    ORDER BY table_sort_order ASC
  `;
  console.log("\nFinal tray (in display order):");
  console.table(result.map(r => ({
    sort: r.table_sort_order,
    id: r.id,
    name: r.name,
    metal: r.metal,
    case: r.case_material,
    cutout: r.has_cutout,
  })));

  // 4. Check grouping
  const gold = result.slice(0,3).map(r=>`${r.id}(${r.metal})`).join(", ");
  const rose = result.slice(3,5).map(r=>`${r.id}(${r.metal})`).join(", ");
  const steel = result.slice(5,7).map(r=>`${r.id}(${r.metal})`).join(", ");
  console.log(`\nTop 3 Gold (y=0.375): ${gold}`);
  console.log(`Bottom Rose 2 (y=0.620): ${rose}`);
  console.log(`Bottom Steel 2 (y=0.620): ${steel}`);
  console.log(`Mobile (first 6, 3x2 grid): ${result.slice(0,6).map(r=>r.id).join(", ")} — drops ${result[6]?.id} (desktop-only 7th)`);

  // 5. Warn if any missing cutout
  const missingCutout = result.filter(r=>r.has_cutout==='NO');
  if (missingCutout.length>0) {
    console.warn(`\nWARNING: ${missingCutout.length} products have no table_cutout_url yet.`);
    console.warn(`They will show fallback until you toggle off/on in /admin/products or re-run cutout generation.`);
    console.warn(`Missing: ${missingCutout.map(r=>r.id).join(", ")}`);
  } else {
    console.log("\nAll 7 have cutouts — tray ready.");
  }

  await sql.end();
  console.log("\nDone. Revalidate: visit / and /admin/products to see updated tray.");
}

main().catch(e=>{ console.error(e); process.exit(1); });
