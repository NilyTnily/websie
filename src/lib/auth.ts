// note: run `bun db:auth` to generate the `users.ts`
// schema after making breaking changes to this file

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { UserDbType } from "~/lib/auth-types";

import { db } from "~/db";
import {
  accountTable,
  rateLimitTable,
  sessionTable,
  twoFactorTable,
  userTable,
  verificationTable,
} from "~/db/schema";
import { sendEmail } from "~/lib/email";

export const auth = betterAuth({
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

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ url, user }) => {
      await sendEmail({
        html: `<p>Someone requested a password reset for your account.</p><p><a href="${url}">Reset your password</a></p><p>If this wasn't you, you can ignore this email.</p>`,
        subject: "Reset your password",
        to: user.email,
      });
    },
  },

  plugins: [twoFactor()],

  // Database-backed so limits hold under multiple server instances —
  // in-memory storage would reset per-instance and be trivially bypassed.
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
      age: {
        input: true,
        required: false,
        type: "number",
      },
      firstName: {
        input: true,
        required: false,
        type: "string",
      },
      lastName: {
        input: true,
        required: false,
        type: "string",
      },
    },
  },
});

export const getCurrentUser = async (): Promise<null | UserDbType> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return null;
  }
  return session.user as UserDbType;
};

export const getCurrentUserOrRedirect = async (
  forbiddenUrl = "/auth/sign-in",
  okUrl = "",
  ignoreForbidden = false,
): Promise<null | UserDbType> => {
  const user = await getCurrentUser();

  // if no user is found
  if (!user) {
    // redirect to forbidden url unless explicitly ignored
    if (!ignoreForbidden) {
      redirect(forbiddenUrl);
    }
    // if ignoring forbidden, return the null user immediately
    // (don't proceed to okUrl check)
    return user; // user is null here
  }

  // if user is found and an okUrl is provided, redirect there
  if (okUrl) {
    redirect(okUrl);
  }

  // if user is found and no okUrl is provided, return the user
  return user; // user is UserDbType here
};
