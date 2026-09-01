import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});
const dials = await sql`SELECT DISTINCT specs->>'Dial' as dial FROM product WHERE category_id='timepieces' ORDER BY dial LIMIT 30`;
console.log(dials.map(r=>r.dial));
const byDial = await sql`
  SELECT specs->>'Dial' as dial, count(*) as cnt FROM product WHERE category_id='timepieces' GROUP BY dial ORDER BY cnt DESC LIMIT 15
`;
console.table(byDial);
// Find watches with similar dials for cohesive tray - propose all with dark dials or all with light dials
// Query candidates with Black dial + Steel case (cohesive cool)
const blackSteel = await sql`
  SELECT id, name, specs->>'Dial' as dial, specs->>'Case Material' as cm, image FROM product
  WHERE specs->>'Dial' ILIKE '%Black%' AND specs->>'Case Material'='Stainless Steel' AND visible=true LIMIT 10
`;
console.log("\nBlack dial Steel:");
console.table(blackSteel.map(r=>({id:r.id.slice(0,45), name:r.name.slice(0,30), dial:r.dial, cm:r.cm})));
const blueSteel = await sql`
  SELECT id, name, specs->>'Dial' as dial, specs->>'Case Material' as cm FROM product
  WHERE specs->>'Dial' ILIKE '%Blue%' AND specs->>'Case Material'='Stainless Steel' AND visible=true LIMIT 10
`;
console.log("\nBlue dial steel");
console.table(blueSteel.map(r=>({id:r.id.slice(0,45), name:r.name.slice(0,30), dial:r.dial})));
const whiteGold = await sql`
  SELECT id, name, specs->>'Dial' as dial, specs->>'Case Material' as cm FROM product
  WHERE specs->>'Dial' ILIKE '%Silver%' OR specs->>'Dial' ILIKE '%White%' AND specs->>'Case Material' IN ('Yellow Gold','Rose Gold','Gold') LIMIT 10
`;
console.log("\nLight dial Gold");
console.table(whiteGold.map(r=>({id:r.id.slice(0,45), name:r.name.slice(0,30), dial:r.dial, cm:r.cm})));
await sql.end();
