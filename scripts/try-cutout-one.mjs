import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

async function test(){
  const id = "patek-philippe-nautilus-5711-1a-011";
  const rows = await sql`SELECT id, image FROM product WHERE id=${id}`;
  console.log(rows[0]);
  // try import generateTableCutout
  try{
    const mod = await import("../src/lib/table-cutout.ts");
    console.log("imported", Object.keys(mod));
  } catch(e){
    console.error("import failed", e);
  }
  await sql.end();
}
test();
