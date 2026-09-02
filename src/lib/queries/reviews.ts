import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import type { ProductReview } from "~/db/schema";

import { db } from "~/db";
import { inquiryTable, productReviewTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";
import {
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_COMMENT_MIN_LENGTH,
} from "~/lib/review-constants";

export interface CreateReviewInput {
  comment: string;
  customerName: string;
  productId: string;
  rating: number;
  userId: string;
}

export interface UpdateReviewInput {
  comment: string;
  rating: number;
}

export interface ProductReviewSummary {
  averageRating: number;
  reviews: ProductReview[];
  totalCount: number;
}

export interface ReviewStats {
  approved: number;
  pending: number;
  total: number;
}

export interface ReviewWithProduct extends ProductReview {
  product: { image: string; name: string };
  user: { email: string; name: string; phone: string | null };
}

const MutationResult = {
  err: (error: string) => ({ error, success: false as const }),
  ok: <T = undefined>(data?: T) => ({ data, success: true as const }),
};

export async function approveReview(
  id: string,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    await db
      .update(productReviewTable)
      .set({ approved: true })
      .where(eq(productReviewTable.id, id));
    const { revalidateTag } = await import("next/cache");
    revalidateTag("reviews");
    return MutationResult.ok();
  } catch (error) {
    console.error("Failed to approve review:", error);
    return MutationResult.err("Could not approve the review.");
  }
}

/** A review can only be left by a signed-in user who has an inquiry that actually included this product — no open review form, no separate spam defenses needed. */
export async function canUserReviewProduct(
  userId: string,
  productId: string,
): Promise<boolean> {
  try {
    const existingReview = await db.query.productReviewTable.findFirst({
      where: and(
        eq(productReviewTable.userId, userId),
        eq(productReviewTable.productId, productId),
      ),
    });
    if (existingReview) return false;

    const inquiries = await db.query.inquiryTable.findMany({
      columns: { items: true },
      where: eq(inquiryTable.userId, userId),
    });
    return inquiries.some((inquiry) =>
      inquiry.items.some((item) => item.id === productId),
    );
  } catch (error) {
    console.error("Failed to check review eligibility:", error);
    return false;
  }
}

export async function getUserReviewForProduct(
  userId: string,
  productId: string,
): Promise<null | ProductReview> {
  try {
    return (
      (await db.query.productReviewTable.findFirst({
        where: and(
          eq(productReviewTable.userId, userId),
          eq(productReviewTable.productId, productId),
        ),
      })) ?? null
    );
  } catch (error) {
    console.error("Failed to fetch user review:", error);
    return null;
  }
}

function validateComment(comment: string): null | string {
  const trimmed = comment.trim();
  if (trimmed.length < REVIEW_COMMENT_MIN_LENGTH) {
    return `Please write at least ${REVIEW_COMMENT_MIN_LENGTH} characters (${trimmed.length}/${REVIEW_COMMENT_MIN_LENGTH}).`;
  }
  if (trimmed.length > REVIEW_COMMENT_MAX_LENGTH) {
    return `Review is too long — max ${REVIEW_COMMENT_MAX_LENGTH} characters (${trimmed.length}/${REVIEW_COMMENT_MAX_LENGTH}).`;
  }
  return null;
}

export async function createReview(
  input: CreateReviewInput,
): Promise<{ error: string; success: false } | { success: true }> {
  const commentError = validateComment(input.comment);
  if (commentError) return MutationResult.err(commentError);

  const eligible = await canUserReviewProduct(input.userId, input.productId);
  if (!eligible) {
    return MutationResult.err(
      "You can only review pieces you've inquired about, and only once.",
    );
  }

  try {
    const [review] = await db
      .insert(productReviewTable)
      .values({
        approved: false,
        comment: input.comment.trim(),
        customerName: input.customerName,
        id: crypto.randomUUID(),
        productId: input.productId,
        rating: Math.min(5, Math.max(1, Math.round(input.rating))),
        userId: input.userId,
      })
      .returning();

    const { revalidateTag } = await import("next/cache");
    revalidateTag("reviews");

    // email notify to admin — best-effort, never blocks the review
    try {
      const { sendEmail } = await import("~/lib/email");
      const product = await db.query.productTable.findFirst({
        columns: { name: true },
        where: eq((await import("~/db/schema")).productTable.id, input.productId),
      });
      const productName = product?.name ?? input.productId;
      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      await Promise.all(
        adminEmails.map((to) =>
          sendEmail({
            html: `<p><strong>${input.customerName}</strong> left a ${input.rating}★ review for <strong>${productName}</strong> (pending approval).</p><p>${input.comment.trim().slice(0, 500)}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/reviews">Moderate in admin</a></p>`,
            subject: `New review for ${productName} — ${input.rating}★ (pending)`,
            to,
          }),
        ),
      );
      // in-app notification for admins
      const { notifyAdmins } = await import("~/lib/queries/notifications");
      await notifyAdmins({
        description: `${input.customerName} left a ${input.rating}★ review for ${productName} — pending approval.`,
        link: "/admin/reviews",
        title: "New review pending",
        type: "info",
      });
    } catch (e) {
      console.error("Failed to notify admins of new review:", e);
    }

    return MutationResult.ok();
  } catch (error) {
    console.error("Failed to create review:", error);
    return MutationResult.err("Could not submit the review.");
  }
}

export async function updateReviewForUser(
  userId: string,
  productId: string,
  input: UpdateReviewInput,
): Promise<{ error: string; success: false } | { success: true }> {
  const commentError = validateComment(input.comment);
  if (commentError) return MutationResult.err(commentError);
  if (!Number.isFinite(input.rating) || input.rating < 1 || input.rating > 5) {
    return MutationResult.err("Please select a rating between 1 and 5.");
  }
  try {
    const existing = await getUserReviewForProduct(userId, productId);
    if (!existing) return MutationResult.err("Review not found.");
    await db
      .update(productReviewTable)
      .set({
        approved: false, // re-moderate after edit
        comment: input.comment.trim(),
        rating: Math.round(input.rating),
      })
      .where(and(eq(productReviewTable.userId, userId), eq(productReviewTable.productId, productId)));
    const { revalidateTag } = await import("next/cache");
    revalidateTag("reviews");
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/products/${productId}`);
    return MutationResult.ok();
  } catch (error) {
    console.error("Failed to update review:", error);
    return MutationResult.err("Could not update the review.");
  }
}

export async function deleteReviewForUser(
  userId: string,
  productId: string,
): Promise<{ error: string; success: false } | { success: true }> {
  try {
    const existing = await getUserReviewForProduct(userId, productId);
    if (!existing) return MutationResult.err("Review not found.");
    await db
      .delete(productReviewTable)
      .where(and(eq(productReviewTable.userId, userId), eq(productReviewTable.productId, productId)));
    const { revalidateTag } = await import("next/cache");
    revalidateTag("reviews");
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/products/${productId}`);
    return MutationResult.ok();
  } catch (error) {
    console.error("Failed to delete review:", error);
    return MutationResult.err("Could not delete the review.");
  }
}

export async function getAllReviewsForAdmin(): Promise<ReviewWithProduct[]> {
  try {
    await requireAdmin();
    return (await db.query.productReviewTable.findMany({
      orderBy: [desc(productReviewTable.createdAt)],
      with: {
        product: { columns: { image: true, name: true } },
        user: { columns: { email: true, name: true, phone: true } },
      },
    })) as unknown as ReviewWithProduct[];
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return [];
  }
}

async function fetchApprovedReviewsForProduct(
  productId: string,
): Promise<ProductReviewSummary> {
  try {
    const reviews = await db.query.productReviewTable.findMany({
      orderBy: [desc(productReviewTable.createdAt)],
      where: and(
        eq(productReviewTable.productId, productId),
        eq(productReviewTable.approved, true),
      ),
    });
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;
    return { averageRating, reviews, totalCount: reviews.length };
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return { averageRating: 0, reviews: [], totalCount: 0 };
  }
}
const cachedApprovedReviews = unstable_cache(fetchApprovedReviewsForProduct, ["approved-reviews"], { revalidate: 60, tags: ["reviews"] });
export async function getApprovedReviewsForProduct(
  productId: string,
): Promise<ProductReviewSummary> {
  return cachedApprovedReviews(productId);
}

export async function getReviewStats(): Promise<ReviewStats> {
  try {
    await requireAdmin();
    const [row] = await db
      .select({
        approved: sql<number>`count(*) filter (where ${productReviewTable.approved} = true)::int`,
        pending: sql<number>`count(*) filter (where ${productReviewTable.approved} = false)::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(productReviewTable);
    return {
      approved: row?.approved ?? 0,
      pending: row?.pending ?? 0,
      total: row?.total ?? 0,
    };
  } catch (error) {
    console.error("Failed to fetch review stats:", error);
    return { approved: 0, pending: 0, total: 0 };
  }
}

export async function rejectReview(
  id: string,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    await db.delete(productReviewTable).where(eq(productReviewTable.id, id));
    const { revalidateTag } = await import("next/cache");
    revalidateTag("reviews");
    return MutationResult.ok();
  } catch (error) {
    console.error("Failed to reject review:", error);
    return MutationResult.err("Could not reject the review.");
  }
}
