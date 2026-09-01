import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});
const tray = await sql`SELECT id, table_cutout_url, image FROM product WHERE on_table=true ORDER BY table_sort_order`;
for (const r of tray){
  const ufs = r.table_cutout_url.includes("ufs.sh");
  console.log(`${r.id} ufs=${ufs} ${r.table_cutout_url.slice(0,60)}`);
}
await sql.end();
