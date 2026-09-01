import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

const products = await sql`
  SELECT 
    p.id, p.name, p.ref, p.description,
    p.subcategory_id, p.model_id, p.category_id, p.case_material, p.movement, p.strap_material, p.metal, p.gemstone,
    s.name as house,
    m.name as model,
    c.name as cat_name, c.slug as cat_slug
  FROM product p
  LEFT JOIN subcategory s ON s.id = p.subcategory_id
  LEFT JOIN watch_model m ON m.id = p.model_id
  LEFT JOIN category c ON c.id = p.category_id
  WHERE p.visible=true
`;

function oldFilter(p, q){
  const nq = q.toLowerCase();
  return p.name.toLowerCase().includes(nq) || p.ref.toLowerCase().includes(nq) || p.description.toLowerCase().includes(nq);
}
function newFilter(p,q){
  const nq = q.toLowerCase();
  const haystack = [
    p.name, p.ref, p.description, p.house ?? "", p.model ?? "", p.cat_name, p.cat_slug,
    p.movement ?? "", p.case_material ?? "", p.strap_material ?? "", p.metal ?? "", p.gemstone ?? ""
  ].join(" ").toLowerCase();
  return haystack.includes(nq);
}

const query = "rolex";
const oldCount = products.filter(p=>oldFilter(p, query)).length;
const newCount = products.filter(p=>newFilter(p, query)).length;
console.log(`Old search "rolex": ${oldCount} (reported bug 12)`);
console.log(`New search "rolex": ${newCount} (expected 310)`);
console.log(`All visible: ${products.length}`);

 // Test other queries
for (const q of ["patek","nautilus","daytona","blue","steel"]){
  const n = products.filter(p=>newFilter(p,q)).length;
  console.log(`New search "${q}": ${n}`);
}

// Pagination test
const PAGE_SIZE=24;
const filtered = products.filter(p=>newFilter(p,"rolex"));
const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
console.log(`\nPagination for "rolex": ${filtered.length} items => ${pageCount} pages (PAGE_SIZE 24)`);
console.log(`Page 1: 1-${Math.min(24,filtered.length)}, Page 2: 25-${Math.min(48,filtered.length)} ...`);

// Check homepage vs browse: ensure getVisibleProductsLite returns all
console.log(`\nVisible products via query: ${products.length} should match getVisibleProductsLite length`);

await sql.end();
