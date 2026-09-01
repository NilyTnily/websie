import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

const caseMats = await sql`SELECT DISTINCT case_material FROM product WHERE category_id='timepieces' ORDER BY case_material`;
console.log("distinct case_material:");
console.table(caseMats);

const metals = await sql`SELECT DISTINCT metal FROM product WHERE category_id='timepieces' AND metal IS NOT NULL ORDER BY metal LIMIT 30`;
console.log("distinct metal:");
console.table(metals);

// find rose gold candidates
const rose = await sql`
  SELECT id, name, case_material, metal, subcategory_id, image, price
  FROM product
  WHERE category_id='timepieces'
  AND (case_material ILIKE '%rose%' OR metal ILIKE '%rose%' OR case_material ILIKE '%pink%')
  AND visible = true
  ORDER BY price DESC
  LIMIT 20
`;
console.log("\nRose candidates:");
console.table(rose.map(r=>({id:r.id, name:r.name.slice(0,40), case:r.case_material, metal:r.metal, sub:r.subcategory_id})));

// gold candidates
const gold = await sql`
  SELECT id, name, case_material, metal, subcategory_id, image, price
  FROM product
  WHERE category_id='timepieces'
  AND (case_material ILIKE '%gold%' OR metal ILIKE '%gold%')
  AND visible = true
  ORDER BY price DESC
  LIMIT 20
`;
console.log("\nGold candidates:");
console.table(gold.map(r=>({id:r.id, name:r.name.slice(0,40), case:r.case_material, metal:r.metal, sub:r.subcategory_id, price:r.price})));

// steel/silver candidates - famous
const steel = await sql`
  SELECT id, name, case_material, subcategory_id, image, price
  FROM product
  WHERE category_id='timepieces'
  AND (case_material ILIKE '%steel%' OR case_material ILIKE '%titanium%' OR case_material = 'Steel')
  AND visible = true
  AND (subcategory_id IN ('patek-philippe','audemars-piguet','rolex','omega','cartier') OR name ILIKE '%nautilus%' OR name ILIKE '%royal oak%' OR name ILIKE '%submariner%' OR name ILIKE '%speedmaster%')
  ORDER BY price DESC
  LIMIT 20
`;
console.log("\nSteel famous candidates:");
console.table(steel.map(r=>({id:r.id, name:r.name.slice(0,45), case:r.case_material, sub:r.subcategory_id, price:r.price})));

// Check current visible watches with gold/rose counts
const countGold = await sql`SELECT count(*) FROM product WHERE category_id='timepieces' AND case_material ILIKE '%gold%'`;
const countRose = await sql`SELECT count(*) FROM product WHERE category_id='timepieces' AND (case_material ILIKE '%rose%' OR metal ILIKE '%rose%')`;
const countSteel = await sql`SELECT count(*) FROM product WHERE category_id='timepieces' AND case_material ILIKE '%steel%'`;
console.log(`\nCounts: gold=${countGold[0].count}, rose=${countRose[0].count}, steel=${countSteel[0].count}`);

await sql.end();
