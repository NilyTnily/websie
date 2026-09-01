import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

const tray = await sql`SELECT id, image, table_cutout_url FROM product WHERE on_table=true`;
console.log("Before fix:");
console.table(tray.map(r=>({id:r.id, cutout: r.table_cutout_url ? "yes":"NO"})));

for (const row of tray){
  if (!row.table_cutout_url){
    await sql`UPDATE product SET table_cutout_url = ${row.image}, updated_at=NOW() WHERE id=${row.id}`;
    console.log(`Fallback set for ${row.id} -> image as cutout`);
  }
}

const after = await sql`SELECT id, table_cutout_url, image FROM product WHERE on_table=true ORDER BY table_sort_order`;
console.log("\nAfter:");
console.table(after.map(r=>({id:r.id, cutout: r.table_cutout_url ? r.table_cutout_url.slice(0,60)+"..." : "NO", isFallback: r.table_cutout_url===r.image})));

// verify filter would now include all 7
const countWithCut = after.filter(r=>r.table_cutout_url).length;
console.log(`\nCount with cutoutUrl (hero will render): ${countWithCut}/7`);

await sql.end();
