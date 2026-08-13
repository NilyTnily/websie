"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "~/lib/auth";
import { createReview } from "~/lib/queries/reviews";

export interface ReviewFormState {
  error?: string;
  success?: boolean;
}

export async function submitReviewAction(
  productId: string,
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in to leave a review." };

  const comment = String(formData.get("comment") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "");
  const rating = Number.parseInt(ratingRaw, 10);

  if (!comment) return { error: "Please write a short review." };
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { error: "Please select a rating between 1 and 5." };
  }

  const result = await createReview({
    comment,
    customerName: user.name || "Verified customer",
    productId,
    rating,
    userId: user.id,
  });

  if (!result.success) return { error: result.error };

  revalidatePath(`/products/${productId}`);
  return { success: true };
}
