import type { testimonialTable } from "./tables";

export type NewTestimonial = typeof testimonialTable.$inferInsert;
export type Testimonial = typeof testimonialTable.$inferSelect;
