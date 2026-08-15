import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor as twoFactorPlugin } from "better-auth/plugins";
import { randomBytes } from "node:crypto";

import { conn, db } from "./index";
import {
  accountTable,
  rateLimitTable,
  sessionTable,
  twoFactorTable,
  userTable,
  verificationTable,
} from "./schema";

/**
 * The Postgres container is Docker-managed and gets wiped/recreated
 * periodically in dev, which repeatedly deletes the admin account. Run
 * `bun db:seed-admin` after any DB reset to recreate it. Uses better-auth's
 * own sign-up flow so the password is hashed the same way the app expects.
 */
const auth = betterAuth({
  baseURL: process.env.NEXT_SERVER_APP_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      account: accountTable,
      rateLimit: rateLimitTable,
      session: sessionTable,
      twoFactor: twoFactorTable,
      user: userTable,
      verification: verificationTable,
    },
  }),
  emailAndPassword: { enabled: true },
  plugins: [twoFactorPlugin()],
  rateLimit: {
    customRules: {
      "/forget-password": { max: 3, window: 60 },
      "/sign-in/email": { max: 5, window: 60 },
      "/sign-up/email": { max: 5, window: 60 },
    },
    enabled: true,
    storage: "database",
  },
  secret: process.env.AUTH_SECRET,
  user: {
    additionalFields: {
      age: { input: true, required: false, type: "number" },
      firstName: { input: true, required: false, type: "string" },
      lastName: { input: true, required: false, type: "string" },
    },
  },
});

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

try {
  await main();
} catch (error: unknown) {
  console.error("Error:", error);
  process.exitCode = 1;
} finally {
  await conn.end();
}
