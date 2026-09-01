import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

// Find cohesive sets: similar colors = same dial family + same case material family
// We want watches that will sit next to each other and look related.
// Best cohesive palettes:
// A) Cool Steel family - all Stainless Steel + dials in Blue/Silver/White/Black (cool, will compliment)
// B) Warm Gold family - all Yellow/Rose Gold + dials in Champagne/Silver/White (warm)
// Let's query for both and show candidates

console.log("=== COHESIVE PALETTE A: Steel + Cool dials (Blue/Silver/Black/White/Gray) ===");
const coolSteel = await sql`
  SELECT id, name, specs->>'Case Material' as cm, specs->>'Dial' as dial, specs->>'Strap' as strap, price, image
  FROM product
  WHERE category_id='timepieces' AND specs->>'Case Material'='Stainless Steel'
  AND specs->>'Dial' IN ('Blue','Black','Silver','White','Gray','Tapisserie','Sunray')
  AND visible=true
  ORDER BY 
    CASE WHEN name ILIKE '%Nautilus%' THEN 0
         WHEN name ILIKE '%Royal Oak%' THEN 1
         WHEN name ILIKE '%Daytona%' THEN 2
         WHEN name ILIKE '%GMT-Master%' THEN 3
         WHEN name ILIKE '%Aquanaut%' THEN 4
         ELSE 5 END,
    price DESC
  LIMIT 15
`;
console.table(coolSteel.map(r=>({id:r.id, name:r.name.slice(0,35), dial:r.dial, strap:r.strap, price:r.price})));

console.log("\n=== COHESIVE PALETTE B: Gold warm + Light dials ===");
const warmGold = await sql`
  SELECT id, name, specs->>'Case Material' as cm, specs->>'Dial' as dial, price
  FROM product
  WHERE category_id='timepieces' AND specs->>'Case Material' IN ('Yellow Gold','Rose Gold')
  AND specs->>'Dial' IN ('White','Silver','Champagne','Sunray','Opaline','Gold')
  AND visible=true
  ORDER BY price DESC LIMIT 15
`;
console.table(warmGold.map(r=>({id:r.id, name:r.name.slice(0,35), dial:r.dial, cm:r.cm, price:r.price})));

// Check image style - want similar photo angles/backgrounds? Check source
const check = await sql`
  SELECT id, image FROM product WHERE id IN ('patek-philippe-nautilus-5711-1a-011','patek-philippe-nautilus-5711-1a-010','patek-philippe-nautilus-5726a-001','rolex-cosmograph-daytona-126500ln-0001','audemars-piguet-royal-oak-15500st','omega-speedmaster-moonwatch-31030425001001')
`;
console.table(check);

await sql.end();
