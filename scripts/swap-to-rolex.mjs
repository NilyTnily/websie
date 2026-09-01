import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

const newIds = [
  "rolex-day-date-40-228396tbr-0002",          // Platinum Blue 139k - expensive
  "rolex-oyster-perpetual-day-date-36-128396tbr-0003", // Platinum Blue 113k
];

const check = await sql`SELECT id, name, specs->>'Case Material' as cm, specs->>'Dial' as dial, price, image FROM product WHERE id IN ${sql(newIds)}`;
console.log("New Rolex candidates:");
console.table(check.map(r=>({id:r.id, name:r.name.slice(0,35), cm:r.cm, dial:r.dial, price:r.price, img: r.image.slice(0,50)})));
if (check.length !== 2){
  console.error("Missing rolex ids, abort");
  await sql.end();
  process.exit(1);
}

// Get current tray
const tray = await sql`SELECT table_sort_order, id FROM product WHERE on_table=true ORDER BY table_sort_order`;
console.log("\nCurrent tray:", tray.map(r=>`${r.table_sort_order}:${r.id}`).join(", "));

// Swap positions 5 and 6 (the two Nautilus)
const toReplace = ["patek-philippe-nautilus-5711-1a-010","patek-philippe-nautilus-5726a-001"];
console.log("\nReplacing:", toReplace.join(", "));

// Clear on_table for those two
await sql`UPDATE product SET on_table=false, table_sort_order=NULL, updated_at=NOW() WHERE id IN ${sql(toReplace)}`;
console.log("Cleared Nautilus");

// Set new Rolexes at positions 5 and 6
for (let i=0;i<newIds.length;i++){
  const sort = 5+i;
  const id = newIds[i];
  await sql`UPDATE product SET on_table=true, table_sort_order=${sort}, visible=true, updated_at=NOW() WHERE id=${id}`;
  console.log(`Set ${sort}: ${id}`);
}

// Set fallback cutout to image initially (will regenerate)
for (const id of newIds){
  const row = await sql`SELECT image FROM product WHERE id=${id}`;
  await sql`UPDATE product SET table_cutout_url=${row[0].image}, updated_at=NOW() WHERE id=${id}`;
}
console.log("Set fallback cutouts");

const verify = await sql`SELECT table_sort_order, id, name, specs->>'Case Material' as cm, specs->>'Dial' as dial, price FROM product WHERE on_table=true ORDER BY table_sort_order`;
console.table(verify.map(r=>({sort:r.table_sort_order, id:r.id.slice(0,45), name:r.name.slice(0,30), cm:r.cm, dial:r.dial, price:r.price})));

await sql.end();
