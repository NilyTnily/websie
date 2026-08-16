import "dotenv/config";
import { sql } from "drizzle-orm";

import { conn, db } from "./index";
import { userTable } from "./schema";

async function main() {
  const users = await db.select({ email: userTable.email, id: userTable.id }).from(userTable).limit(10);
  console.log("USERS:", JSON.stringify(users, null, 2));

  const tbl = await db.execute(sql`select tablename from pg_tables where schemaname='public' order by tablename`);
  console.log("TABLES:", JSON.stringify(tbl, null, 2));

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
