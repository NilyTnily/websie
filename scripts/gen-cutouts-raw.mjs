import postgres from 'postgres';
import { removeBackground } from '@imgly/background-removal-node';
import { UTApi } from 'uploadthing/server';
import 'dotenv/config';
import { fileURLToPath } from 'url';

const sql = postgres(process.env.DATABASE_URL);
const utapi = new UTApi();

const ids = [
  'patek-philippe-grand-complications-joaillerie-6300-403g-001-6300-403g-001',
  'patek-philippe-grand-complications-joaillerie-6300-401g-001-6300-401g-001',
  'patek-philippe-grand-complications-5374-400p-001-5374-400p-001',
  'patek-philippe-grand-complications-joaillerie-6300-400g-001-6300-400g-001',
  'patek-philippe-grand-complications-joaillerie-6300gr-001-6300gr-001',
];

for (const id of ids) {
  const rows = await sql`select id, name, image, table_cutout_url from product where id = ${id}`;
  const prod = rows[0];
  console.log(`\n=== ${prod.name} (${prod.id}) ===`);
  console.log('source', prod.image);
  try {
    console.log('removing background (this downloads ONNX model first time, ~80MB)...');
    const blob = await removeBackground(prod.image);
    const buffer = Buffer.from(await blob.arrayBuffer());
    console.log('buffer size', buffer.length);
    const file = new File([buffer], `${id}-table-cutout.png`, { type: 'image/png' });
    console.log('uploading to UploadThing...');
    const { data, error } = await utapi.uploadFiles(file);
    if (error) {
      console.error('upload error', error);
      continue;
    }
    console.log('uploaded', data.ufsUrl);
    await sql`update product set table_cutout_url = ${data.ufsUrl}, updated_at = now() where id = ${id}`;
    console.log('DB updated');
  } catch (e) {
    console.error('failed', e);
  }
}
await sql.end();
console.log('done');
