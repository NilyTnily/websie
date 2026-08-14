import "dotenv/config";
import { randomBytes } from "node:crypto";

import { auth } from "~/lib/auth";

import { db } from "./index";

/**
 * The Postgres container is Docker-managed and gets wiped/recreated
 * periodically in dev, which repeatedly deletes the admin account. Run
 * `bun db:seed-admin` after any DB reset to recreate it. Uses better-auth's
 * own sign-up flow so the password is hashed the same way the app expects.
 */
async function main() {
  const email = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
  if (!email) {
    throw new Error("🔴 ADMIN_EMAILS is not set — nothing to seed");
  }

  const existing = await db.query.userTable.findFirst({
    where: (fields, { eq }) => eq(fields.email, email),
  });
  if (existing) {
    console.log(`✔ Admin user already exists: ${email}`);
    return;
  }

  const password =
    process.env.ADMIN_PASSWORD ?? randomBytes(9).toString("base64url");

  const result = await auth.api.signUpEmail({
    body: {
      email,
      name: "Admin",
      password,
    },
  });

  if (!result) {
    throw new Error("🔴 Failed to create admin user");
  }

  console.log(`✔ Admin user created: ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(
      `  Generated password (save this, it won't be shown again): ${password}`,
    );
  }
}

await main().catch((error: unknown) => {
  console.error("Error:", error);
  process.exit(1);
});
