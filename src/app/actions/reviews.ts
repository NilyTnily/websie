"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "~/lib/auth";
import {
  createReview,
  deleteReviewForUser,
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_COMMENT_MIN_LENGTH,
  updateReviewForUser,
} from "~/lib/queries/reviews";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit";

export interface ReviewFormState {
  error?: string;
  success?: boolean;
}

const REVIEW_RATE_LIMIT_MAX = 3;
const REVIEW_RATE_LIMIT_WINDOW_MS = 60_000;
const REVIEW_IP_RATE_LIMIT_MAX = 10;
const REVIEW_IP_RATE_LIMIT_WINDOW_MS = 60_000;

export async function submitReviewAction(
  productId: string,
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in to leave a review." };

  const ip = await getClientIp();
  const [userAllowed, ipAllowed] = await Promise.all([
    checkRateLimit(`review:user:${user.id}`, REVIEW_RATE_LIMIT_MAX, REVIEW_RATE_LIMIT_WINDOW_MS),
    checkRateLimit(`review:ip:${ip}`, REVIEW_IP_RATE_LIMIT_MAX, REVIEW_IP_RATE_LIMIT_WINDOW_MS),
  ]);
  if (!userAllowed || !ipAllowed) {
    return { error: "Too many reviews — please wait a minute and try again." };
  }

  const comment = String(formData.get("comment") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "");
  const rating = Number.parseInt(ratingRaw, 10);

  if (comment.length < REVIEW_COMMENT_MIN_LENGTH) {
    return { error: `Please write at least ${REVIEW_COMMENT_MIN_LENGTH} characters (${comment.length}/${REVIEW_COMMENT_MIN_LENGTH}).` };
  }
  if (comment.length > REVIEW_COMMENT_MAX_LENGTH) {
    return { error: `Review is too long — max ${REVIEW_COMMENT_MAX_LENGTH} characters.` };
  }
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

export async function updateReviewAction(
  productId: string,
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };
  const ip = await getClientIp();
  const allowed = await checkRateLimit(`review:update:${user.id}`, 5, 60_000);
  const ipAllowed = await checkRateLimit(`review:ip:${ip}`, 10, 60_000);
  if (!allowed || !ipAllowed) return { error: "Too many requests — please wait." };

  const comment = String(formData.get("comment") ?? "").trim();
  const rating = Number.parseInt(String(formData.get("rating") ?? ""), 10);
  if (comment.length < REVIEW_COMMENT_MIN_LENGTH) {
    return { error: `Please write at least ${REVIEW_COMMENT_MIN_LENGTH} characters.` };
  }
  if (comment.length > REVIEW_COMMENT_MAX_LENGTH) {
    return { error: `Review is too long — max ${REVIEW_COMMENT_MAX_LENGTH} characters.` };
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { error: "Please select a rating between 1 and 5." };
  }
  const result = await updateReviewForUser(user.id, productId, { comment, rating });
  if (!result.success) return { error: result.error };
  revalidatePath(`/products/${productId}`);
  return { success: true };
}

export async function deleteReviewAction(productId: string): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };
  const result = await deleteReviewForUser(user.id, productId);
  if (!result.success) return { error: result.error };
  revalidatePath(`/products/${productId}`);
  return { success: true };
}
