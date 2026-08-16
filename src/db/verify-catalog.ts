import "dotenv/config";
import { sql } from "drizzle-orm";

import { conn, db } from "./index";

const r = await db.execute(sql`select
  (select count(*)::int from category) as categories,
  (select count(*)::int from subcategory) as subcategories,
  (select count(*)::int from product) as products,
  (select count(*)::int from subcategory where category_id = 'timepieces') as timepiece_subcats,
  (select count(*)::int from product where category_id = 'timepieces') as timepiece_products,
  (select count(*)::int from product where category_id = 'fine-jewelry') as jewelry_products`);
console.log(JSON.stringify(r, null, 2));

const dupes = await db.execute(sql`select ref, count(*)::int as n from product group by ref having count(*) > 1`);
console.log("DUPE REFS:", JSON.stringify(dupes, null, 2));

const orphans = await db.execute(sql`select count(*)::int as n from product p left join subcategory s on s.id = p.subcategory_id where s.id is null`);
console.log("ORPHAN PRODUCTS:", JSON.stringify(orphans, null, 2));

const subcatNoProducts = await db.execute(sql`select s.id from subcategory s left join product p on p.subcategory_id = s.id where p.id is null`);
console.log("SUBCATS WITHOUT PRODUCTS:", JSON.stringify(subcatNoProducts, null, 2));

const featured = await db.execute(sql`select category_id, featured, count(*)::int as n from product group by category_id, featured order by category_id, featured`);
console.log("FEATURED BY CATEGORY:", JSON.stringify(featured, null, 2));

const featuredRows = await db.execute(sql`select id, name, ref, price, image from product where featured = true order by price desc`);
console.log("FEATURED ROWS:", JSON.stringify(featuredRows, null, 2));

await conn.end();
