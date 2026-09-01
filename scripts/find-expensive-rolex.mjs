import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});
const rolexExp = await sql`
  SELECT id, name, specs->>'Case Material' as cm, specs->>'Dial' as dial, price FROM product
  WHERE subcategory_id='rolex' AND visible=true
  ORDER BY price DESC LIMIT 20
`;
console.table(rolexExp.map(r=>({id:r.id.slice(0,55), name:r.name.slice(0,35), cm:r.cm, dial:r.dial, price:r.price})));
// Also check steel expensive rolex
const steelExp = await sql`
  SELECT id, name, specs->>'Case Material' as cm, price FROM product
  WHERE subcategory_id='rolex' AND specs->>'Case Material'='Stainless Steel'
  ORDER BY price DESC LIMIT 20
`;
console.log("\nSteel expensive Rolex:");
console.table(steelExp.map(r=>({id:r.id.slice(0,55), name:r.name.slice(0,35), cm:r.cm, price:r.price})));
await sql.end();
