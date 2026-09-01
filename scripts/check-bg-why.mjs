import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});
const tray = await sql`SELECT id, image, table_cutout_url FROM product WHERE on_table=true ORDER BY table_sort_order`;
console.log(tray);
await sql.end();
