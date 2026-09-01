import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

async function fetchOne(id){
  const r = await sql`SELECT id, name, specs->>'Case Material' as case_mat, specs->>'Dial' as dial, price, image, subcategory_id FROM product WHERE id=${id}`;
  return r[0];
}

// Candidate lookups
const candidates = [
  // Gold
  "rolex-oyster-perpetual-day-date-40-228238-0069",
  "rolex-oyster-perpetual-day-date-36-128238-0123",
  "patek-philippe-grand-complications-5270j-001-5270j-001",
  "audemars-piguet-royal-oak-perpetual-calendar-26574baoo1220ba01",
  "rolex-cosmograph-daytona-116588tbr",
  "patek-philippe-nautilus-5711-1a-011", // classic nautilus steel? check id pattern
];

// Search for Nautilus steel regular
const nautilusSteel = await sql`
  SELECT id, name, specs->>'Case Material' as case_mat, specs->>'Dial' as dial, price FROM product
  WHERE name ILIKE '%Nautilus%' AND specs->>'Case Material'='Stainless Steel' AND visible=true
  ORDER BY price ASC LIMIT 10
`;
console.log("Nautilus steel regular:");
console.table(nautilusSteel.map(r=>({id:r.id, name:r.name.slice(0,35), case_mat:r.case_mat, dial:r.dial, price:r.price})));

const daytonaSteel = await sql`
  SELECT id, name, specs->>'Case Material' as case_mat, price FROM product
  WHERE name ILIKE '%Daytona%' AND specs->>'Case Material'='Stainless Steel' LIMIT 5
`;
console.log("\nDaytona steel:");
console.table(daytonaSteel.map(r=>({id:r.id, name:r.name.slice(0,35), case_mat:r.case_mat, price:r.price})));

const apSteel = await sql`
  SELECT id, name, specs->>'Case Material' as case_mat, price FROM product
  WHERE subcategory_id='audemars-piguet' AND specs->>'Case Material'='Stainless Steel' AND visible=true ORDER BY price DESC LIMIT 10
`;
console.log("\nAP steel:");
console.table(apSteel.map(r=>({id:r.id.slice(0,50), name:r.name.slice(0,35), price:r.price})));

const rolexSteel = await sql`
  SELECT id, name, specs->>'Case Material' as case_mat, price FROM product
  WHERE subcategory_id='rolex' AND specs->>'Case Material'='Stainless Steel' AND visible=true ORDER BY price ASC LIMIT 15
`;
console.log("\nRolex steel cheap:");
console.table(rolexSteel.map(r=>({id:r.id, name:r.name.slice(0,35), case_mat:r.case_mat, price:r.price})));

await sql.end();
