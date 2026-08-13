"use server";

import { revalidatePath } from "next/cache";

import { approveReview, rejectReview } from "~/lib/queries/reviews";

export async function approveReviewAction(id: string): Promise<void> {
  await approveReview(id);
  revalidatePath("/admin/reviews");
}

export async function rejectReviewAction(id: string): Promise<void> {
  await rejectReview(id);
  revalidatePath("/admin/reviews");
}
