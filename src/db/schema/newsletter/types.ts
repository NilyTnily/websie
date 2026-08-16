import type { newsletterSignupTable } from "./tables";

export type NewNewsletterSignup = typeof newsletterSignupTable.$inferInsert;
export type NewsletterSignup = typeof newsletterSignupTable.$inferSelect;
