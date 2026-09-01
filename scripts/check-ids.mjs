import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});
const rows = await sql`SELECT id, name, metal FROM product WHERE id LIKE 'cartier%' OR id LIKE 'patek%' OR id LIKE 'piaget%' OR id LIKE 'breguet%' OR id LIKE 'rolex%' LIMIT 30`;
console.table(rows);
const all = await sql`SELECT id FROM product LIMIT 5`;
console.log("sample total", all.length);
await sql.end();
