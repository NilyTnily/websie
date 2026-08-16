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
  const email = process.env.USER_EMAILS?.split(",")[0]?.trim() ?? "user@krs.local";
  const name = process.env.USER_NAME?.trim() ?? "User";

  const existing = await db.query.userTable.findFirst({
    where: (fields, { eq }) => eq(fields.email, email),
  });
  if (existing) {
    console.log(`✔ Normal user already exists: ${email}`);
    return;
  }

  const password =
    process.env.USER_PASSWORD ?? randomBytes(12).toString("base64url");

  const result = await auth.api.signUpEmail({
    body: {
      email,
      name,
      password,
    },
  });

  if (!result) {
    throw new Error("🔴 Failed to create normal user");
  }

  console.log(`✔ Normal user created: ${email}`);
  if (!process.env.USER_PASSWORD) {
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
