import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {prepare:false, max:1});

// Mimic table-cutout.ts without server-only import
import { UTApi } from "uploadthing/server";
const utapi = new UTApi();

async function generateCutout(productId, sourceImageUrl){
  console.log(`Generating cutout for ${productId} from ${sourceImageUrl.slice(0,80)}...`);
  try{
    const { removeBackground } = await import("@imgly/background-removal-node");
    const { default: sharp } = await import("sharp");
    const blob = await removeBackground(sourceImageUrl);
    const rawBuffer = Buffer.from(await blob.arrayBuffer());
    const buffer = await sharp(rawBuffer).trim().toBuffer();
    const file = new File([buffer], `${productId}-table-cutout.png`, {type: "image/png"});
    const { data, error } = await utapi.uploadFiles(file);
    if (error) throw new Error(error.message);
    console.log(`  -> uploaded ${data.ufsUrl.slice(0,60)}`);
    return data.ufsUrl;
  } catch(e){
    console.error(`  FAILED ${productId}:`, e.message || e);
    throw e;
  }
}

const tray = await sql`SELECT id, image, table_cutout_url FROM product WHERE on_table=true ORDER BY table_sort_order`;
console.log(`Found ${tray.length} on_table`);
for (const r of tray){
  const isFallback = r.table_cutout_url === r.image;
  const needsGen = !r.table_cutout_url || isFallback;
  console.log(`${r.id} needsGen=${needsGen} fallback=${isFallback}`);
  if (needsGen){
    try{
      const url = await generateCutout(r.id, r.image);
      await sql`UPDATE product SET table_cutout_url=${url}, updated_at=NOW() WHERE id=${r.id}`;
      console.log(`  DB updated for ${r.id}`);
    } catch(e){
      console.log(`  Keep fallback for ${r.id}`);
    }
  }
}
await sql.end();
console.log("Done");
