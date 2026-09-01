import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

const everose = await sql`
  SELECT id, name, specs->>'Case Material' as case_mat, specs->>'Strap' as strap, specs->>'Dial' as dial, price, image
  FROM product
  WHERE specs::text ILIKE '%Everose%' OR specs::text ILIKE '%Rose%Gold%'
  LIMIT 20
`;
console.log("Everose/Rose Gold count", everose.length);
console.table(everose.map(r=>({id:r.id, name:r.name.slice(0,35), case_mat:r.case_mat, strap:r.strap, dial:r.dial, price: r.price})));

const yellow = await sql`
  SELECT id, name, specs->>'Case Material' as case_mat, price
  FROM product
  WHERE specs->>'Case Material' = 'Yellow Gold' AND visible=true
  ORDER BY price DESC
  LIMIT 15
`;
console.log("\nYellow Gold candidates (high value):");
console.table(yellow.map(r=>({id:r.id, name:r.name.slice(0,35), case_mat:r.case_mat, price:r.price})));

const wg = await sql`
  SELECT id, name, specs->>'Case Material' as case_mat, price
  FROM product
  WHERE specs->>'Case Material' = 'White Gold' AND visible=true
  ORDER BY price DESC
  LIMIT 10
`;
console.log("\nWhite Gold candidates:");
console.table(wg.map(r=>({id:r.id, name:r.name.slice(0,35), case_mat:r.case_mat, price:r.price})));

const steelFamous = await sql`
  SELECT id, name, specs->>'Case Material' as case_mat, specs->>'Dial' as dial, subcategory_id, price, image
  FROM product
  WHERE specs->>'Case Material' = 'Stainless Steel' OR case_material='Steel'
  ORDER BY price DESC
  LIMIT 20
`;
console.log("\nSteel candidates (famous check by name):");
console.table(steelFamous.slice(0,10).map(r=>({id:r.id.slice(0,40), name:r.name.slice(0,30), case_mat:r.case_mat, dial:r.dial, sub:r.subcategory_id})));

// also check steel count with correct filter
const steelCount = await sql`SELECT count(*) FROM product WHERE specs->>'Case Material' = 'Stainless Steel'`;
console.log("Stainless Steel count", steelCount[0].count);
const goldCount = await sql`SELECT count(*) FROM product WHERE specs->>'Case Material' = 'Yellow Gold'`;
console.log("Yellow count", goldCount[0].count);
const roseCount = await sql`SELECT count(*) FROM product WHERE specs->>'Case Material' = 'Everose Gold' OR specs->>'Case Material' = 'Rose Gold'`;
console.log("Rose count", roseCount[0].count);

await sql.end();
