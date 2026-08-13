import "server-only";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { Testimonial } from "~/db/schema";

import { db } from "~/db";
import { testimonialTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";

export interface TestimonialInput {
  avatarUrl: null | string;
  customerHandle: string;
  customerName: string;
  quote: string;
  sortOrder?: number;
}

export type MutationResult<T = undefined> =
  | { data: T; success: true }
  | { error: string; success: false };

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    return await db.query.testimonialTable.findMany({
      orderBy: [asc(testimonialTable.sortOrder)],
    });
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    return [];
  }
}

export async function getAllTestimonialsForAdmin(): Promise<Testimonial[]> {
  await requireAdmin();
  return getTestimonials();
}

export async function getTestimonialById(
  id: string,
): Promise<null | Testimonial> {
  await requireAdmin();
  try {
    return (
      (await db.query.testimonialTable.findFirst({
        where: eq(testimonialTable.id, id),
      })) ?? null
    );
  } catch (error) {
    console.error("Failed to fetch testimonial:", error);
    return null;
  }
}

export async function createTestimonial(
  input: TestimonialInput,
): Promise<MutationResult<{ id: string }>> {
  await requireAdmin();
  try {
    const id = crypto.randomUUID();
    await db.insert(testimonialTable).values({
      avatarUrl: input.avatarUrl,
      customerHandle: input.customerHandle,
      customerName: input.customerName,
      id,
      quote: input.quote,
      sortOrder: input.sortOrder ?? 0,
    });
    revalidatePath("/", "layout");
    return { data: { id }, success: true };
  } catch (error) {
    console.error("Failed to create testimonial:", error);
    return { error: "Could not create the testimonial.", success: false };
  }
}

export async function updateTestimonial(
  id: string,
  input: TestimonialInput,
): Promise<MutationResult> {
  await requireAdmin();
  try {
    await db
      .update(testimonialTable)
      .set({
        avatarUrl: input.avatarUrl,
        customerHandle: input.customerHandle,
        customerName: input.customerName,
        quote: input.quote,
        sortOrder: input.sortOrder ?? 0,
      })
      .where(eq(testimonialTable.id, id));
    revalidatePath("/", "layout");
    return { data: undefined, success: true };
  } catch (error) {
    console.error("Failed to update testimonial:", error);
    return { error: "Could not update the testimonial.", success: false };
  }
}

export async function deleteTestimonial(id: string): Promise<MutationResult> {
  await requireAdmin();
  try {
    await db.delete(testimonialTable).where(eq(testimonialTable.id, id));
    revalidatePath("/", "layout");
    return { data: undefined, success: true };
  } catch (error) {
    console.error("Failed to delete testimonial:", error);
    return { error: "Could not delete the testimonial.", success: false };
  }
}
