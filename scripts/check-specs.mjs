import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

const prod = await sql`
  SELECT id, name, case_material, specs, description FROM product 
  WHERE id IN ('rolex-oyster-perpetual-day-date-36-128238-0123','rolex-cosmograph-daytona-126579rbr-0001','rolex-deepsea-136668lb-0001')
`;
console.log(JSON.stringify(prod, null, 2));

const roseLike = await sql`
  SELECT id, name, case_material, specs FROM product 
  WHERE category_id='timepieces' AND case_material='Gold'
  AND (name ILIKE '%ros%' OR name ILIKE '% Everose%' OR description ILIKE '%rose%' OR description ILIKE '%Everose%' OR specs::text ILIKE '%rose%')
  LIMIT 10
`;
console.log("roseLike Gold:", roseLike.length);
console.table(roseLike.map(r=>({id:r.id, name:r.name.slice(0,40), spec: JSON.stringify(r.specs).slice(0,120)})));

const steelLike = await sql`
  SELECT id, name, case_material, specs FROM product 
  WHERE category_id='timepieces' AND case_material='Gold'
  LIMIT 3
`;
console.log("gold specs example:", JSON.stringify(steelLike[0], null, 2));

await sql.end();
