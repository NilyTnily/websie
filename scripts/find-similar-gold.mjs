import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

const goldLight = await sql`
  SELECT id, name, specs->>'Case Material' as cm, specs->>'Dial' as dial, price, image
  FROM product
  WHERE specs->>'Case Material'='Yellow Gold' AND specs->>'Dial' IN ('White','Silver','Opaline','Sunray','Gray')
  AND visible=true ORDER BY price DESC LIMIT 20
`;
console.table(goldLight.map(r=>({id:r.id.slice(0,45), name:r.name.slice(0,30), dial:r.dial, cm:r.cm, price:r.price})));

const roseLight = await sql`
  SELECT id, name, specs->>'Case Material' as cm, specs->>'Dial' as dial FROM product
  WHERE specs->>'Case Material'='Rose Gold' AND specs->>'Dial' IN ('White','Silver','Opaline','Sunray','Silver','Embossed')
  LIMIT 10
`;
console.table(roseLight.map(r=>({id:r.id.slice(0,45), name:r.name.slice(0,30), dial:r.dial})));

const steelDark = await sql`
  SELECT id, name, specs->>'Dial' as dial FROM product
  WHERE specs->>'Case Material'='Stainless Steel' AND specs->>'Dial' IN ('Black','Blue','Tapisserie')
  LIMIT 10
`;
console.table(steelDark.map(r=>({id:r.id.slice(0,45), name:r.name.slice(0,30), dial:r.dial})));

await sql.end();
