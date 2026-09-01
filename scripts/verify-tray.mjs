import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});
const tray = await sql`
  SELECT table_sort_order, id, name, case_material, specs->>'Case Material' as spec_case, specs->>'Dial' as dial, image, substring(table_cutout_url,1,50) as cutout
  FROM product WHERE on_table=true ORDER BY table_sort_order
`;
console.table(tray.map(r=>({sort:r.table_sort_order, id:r.id, name:r.name.slice(0,32), col:r.case_material, spec:r.spec_case, dial:r.dial})));
await sql.end();
