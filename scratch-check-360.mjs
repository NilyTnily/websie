import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL);

const totalWatches = await sql`
  SELECT count(*) FROM product p
  JOIN category c ON c.id = p.category_id
  WHERE c.slug = 'watches' OR c.name ILIKE '%watch%'`;
console.log("total watch products:", JSON.stringify(totalWatches));

const withMedia = await sql`
  SELECT media_type, count(*) FROM product_image GROUP BY media_type`;
console.log("product_image rows by media_type:", JSON.stringify(withMedia));

const categories = await sql`SELECT id, name, slug FROM category`;
console.log("categories:", JSON.stringify(categories));
await sql.end();
