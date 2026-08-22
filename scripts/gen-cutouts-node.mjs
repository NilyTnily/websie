import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema/index.ts';
import { productTable } from '../src/db/schema/catalog/tables.ts';
import { removeBackground } from '@imgly/background-removal-node';
import { UTApi } from 'uploadthing/server';
import 'dotenv/config';

const url = process.env.DATABASE_URL;
const conn = postgres(url);
const db = drizzle(conn, { schema });
const utapi = new UTApi();

const ids = [
  'patek-philippe-grand-complications-joaillerie-6300-403g-001-6300-403g-001',
  'patek-philippe-grand-complications-joaillerie-6300-401g-001-6300-401g-001',
  'patek-philippe-grand-complications-5374-400p-001-5374-400p-001',
  'patek-philippe-grand-complications-joaillerie-6300-400g-001-6300-400g-001',
  'patek-philippe-grand-complications-joaillerie-6300gr-001-6300gr-001',
];

for (const id of ids) {
  const prod = await db.query.productTable.findFirst({ where: eq(productTable.id, id), columns: { id: true, image: true, name: true, tableCutoutUrl: true } });
  console.log(`\n=== ${prod.name} (${prod.id}) ===`);
  console.log('source', prod.image);
  try {
    console.log('removing background...');
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
    await db.update(productTable).set({ tableCutoutUrl: data.ufsUrl, updatedAt: new Date() }).where(eq(productTable.id, id));
    console.log('DB updated');
  } catch (e) {
    console.error('failed', e);
  }
}
await conn.end();
console.log('done');
