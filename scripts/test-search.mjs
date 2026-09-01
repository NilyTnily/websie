import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});
const products = await sql`
  SELECT name, ref, description, subcategory_id, 
         (SELECT name FROM subcategory WHERE id=product.subcategory_id) as house,
         (SELECT name FROM watch_model WHERE id=product.model_id) as model
  FROM product WHERE visible=true LIMIT 20
`;
console.log("sample houses:");
console.table(products.slice(0,5).map(p=>({name:p.name, house:p.house, model:p.model, ref:p.ref})));

const rolexByName = await sql`SELECT count(*) FROM product WHERE visible=true AND (name ILIKE '%rolex%' OR ref ILIKE '%rolex%' OR description ILIKE '%rolex%')`;
console.log("count where name/ref/desc contains rolex:", rolexByName[0].count);

const rolexByHouse = await sql`SELECT count(*) FROM product WHERE visible=true AND subcategory_id='rolex'`;
console.log("count where house rolex:", rolexByHouse[0].count);

await sql.end();
