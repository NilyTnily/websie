import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";

import type { ProductReview } from "~/db/schema";

import { db } from "~/db";
import { inquiryTable, productReviewTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";

export interface CreateReviewInput {
  comment: string;
  customerName: string;
  productId: string;
  rating: number;
  userId: string;
}

export interface ProductReviewSummary {
  averageRating: number;
  reviews: ProductReview[];
  totalCount: number;
}

export interface ReviewWithProduct extends ProductReview {
  product: { image: string; name: string };
}

export interface ReviewStats {
  approved: number;
  pending: number;
  total: number;
}

const MutationResult = {
  err: (error: string) => ({ error, success: false as const }),
  ok: <T = undefined>(data?: T) => ({ data, success: true as const }),
};

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

export async function createReview(
  input: CreateReviewInput,
): Promise<{ error: string; success: false } | { success: true }> {
  const eligible = await canUserReviewProduct(input.userId, input.productId);
  if (!eligible) {
    return MutationResult.err(
      "You can only review pieces you've inquired about, and only once.",
    );
  }

  try {
    await db.insert(productReviewTable).values({
      approved: false,
      comment: input.comment,
      customerName: input.customerName,
      id: crypto.randomUUID(),
      productId: input.productId,
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      userId: input.userId,
    });
    return MutationResult.ok();
  } catch (error) {
    console.error("Failed to create review:", error);
    return MutationResult.err("Could not submit the review.");
  }
}

export async function getApprovedReviewsForProduct(
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

export async function getAllReviewsForAdmin(): Promise<ReviewWithProduct[]> {
  await requireAdmin();
  try {
    return await db.query.productReviewTable.findMany({
      orderBy: [desc(productReviewTable.createdAt)],
      with: { product: { columns: { image: true, name: true } } },
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return [];
  }
}

export async function getReviewStats(): Promise<ReviewStats> {
  await requireAdmin();
  try {
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

export async function approveReview(
  id: string,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    await db
      .update(productReviewTable)
      .set({ approved: true })
      .where(eq(productReviewTable.id, id));
    return MutationResult.ok();
  } catch (error) {
    console.error("Failed to approve review:", error);
    return MutationResult.err("Could not approve the review.");
  }
}

export async function rejectReview(
  id: string,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    await db.delete(productReviewTable).where(eq(productReviewTable.id, id));
    return MutationResult.ok();
  } catch (error) {
    console.error("Failed to reject review:", error);
    return MutationResult.err("Could not reject the review.");
  }
}
