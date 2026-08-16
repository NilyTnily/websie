import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";

import type { Inquiry } from "~/db/schema";

import { db } from "~/db";
import {
  categoryTable,
  inquiryTable,
  productReviewTable,
  productTable,
  userTable,
} from "~/db/schema";
import { requireAdmin } from "~/lib/admin";
import { formatOrderNumber } from "~/lib/order-number";

export interface DashboardStats {
  approvedValue: number;
  featuredCount: number;
  outOfStock: number;
  pendingCount: number;
  recentInquiries: Inquiry[];
  topProducts: TopRequestedProduct[];
  totalCategories: number;
  totalProducts: number;
  totalRequestedValue: number;
  totalUsers: number;
}

export interface TopRequestedProduct {
  id: string;
  image: string;
  name: string;
  requestCount: number;
}

const EMPTY_STATS: DashboardStats = {
  approvedValue: 0,
  featuredCount: 0,
  outOfStock: 0,
  pendingCount: 0,
  recentInquiries: [],
  topProducts: [],
  totalCategories: 0,
  totalProducts: 0,
  totalRequestedValue: 0,
  totalUsers: 0,
};

export interface InquiriesAging {
  count: number;
  oldestDays: number;
}

export interface QueueItem {
  href: string;
  meta: string;
  tag: string;
  tagColor: string;
  title: string;
}

export interface RevenueDelta {
  currentValue: number;
  /** null when the prior 30-day window had zero revenue — a percent change against zero is meaningless. */
  percentChange: null | number;
}

export async function getAwaitingDispatchCount(): Promise<number> {
  await requireAdmin();
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inquiryTable)
      .where(
        and(
          eq(inquiryTable.status, "approved"),
          sql`${inquiryTable.deliveryStatus} in ('placed', 'confirmed', 'processing')`,
        ),
      );
    return row?.count ?? 0;
  } catch (error) {
    console.error("Failed to fetch awaiting-dispatch count:", error);
    return 0;
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();
  try {
    const [productStats] = await db
      .select({
        featured: sql<number>`count(*) filter (where ${productTable.featured} = true)::int`,
        outOfStock: sql<number>`count(*) filter (where ${productTable.inStock} = false)::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(productTable);

    const [categoryStats] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(categoryTable);

    const [userStats] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(userTable);

    const [inquiryValueStats] = await db
      .select({
        approvedValue: sql<number>`coalesce(sum(${inquiryTable.subtotal}) filter (where ${inquiryTable.status} = 'approved'), 0)::int`,
        pendingCount: sql<number>`count(*) filter (where ${inquiryTable.status} = 'pending')::int`,
        totalRequestedValue: sql<number>`coalesce(sum(${inquiryTable.subtotal}), 0)::int`,
      })
      .from(inquiryTable);

    const recentInquiries = await db.query.inquiryTable.findMany({
      limit: 5,
      orderBy: [desc(inquiryTable.createdAt)],
    });

    const allInquiryItems = await db.query.inquiryTable.findMany({
      columns: { items: true },
    });

    const productCounts = new Map<string, TopRequestedProduct>();
    for (const inquiry of allInquiryItems) {
      for (const item of inquiry.items) {
        const existing = productCounts.get(item.id);
        if (existing) {
          existing.requestCount += item.quantity;
        } else {
          productCounts.set(item.id, {
            id: item.id,
            image: item.image,
            name: item.name,
            requestCount: item.quantity,
          });
        }
      }
    }
    const topProducts = [...productCounts.values()]
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 5);

    return {
      approvedValue: inquiryValueStats?.approvedValue ?? 0,
      featuredCount: productStats?.featured ?? 0,
      outOfStock: productStats?.outOfStock ?? 0,
      pendingCount: inquiryValueStats?.pendingCount ?? 0,
      recentInquiries,
      topProducts,
      totalCategories: categoryStats?.total ?? 0,
      totalProducts: productStats?.total ?? 0,
      totalRequestedValue: inquiryValueStats?.totalRequestedValue ?? 0,
      totalUsers: userStats?.total ?? 0,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return EMPTY_STATS;
  }
}

export async function getInquiriesAging(): Promise<InquiriesAging> {
  await requireAdmin();
  try {
    const [row] = await db
      .select({
        count: sql<number>`count(*)::int`,
        oldestDays: sql<number>`coalesce(extract(day from now() - min(${inquiryTable.createdAt})), 0)::int`,
      })
      .from(inquiryTable)
      .where(eq(inquiryTable.status, "pending"));
    return { count: row?.count ?? 0, oldestDays: row?.oldestDays ?? 0 };
  } catch (error) {
    console.error("Failed to fetch aging inquiries:", error);
    return { count: 0, oldestDays: 0 };
  }
}

export async function getRevenueDelta(): Promise<RevenueDelta> {
  await requireAdmin();
  try {
    const [row] = await db
      .select({
        current: sql<number>`coalesce(sum(${inquiryTable.subtotal}) filter (where ${inquiryTable.status} = 'approved' and ${inquiryTable.createdAt} >= now() - interval '30 days'), 0)::int`,
        prior: sql<number>`coalesce(sum(${inquiryTable.subtotal}) filter (where ${inquiryTable.status} = 'approved' and ${inquiryTable.createdAt} >= now() - interval '60 days' and ${inquiryTable.createdAt} < now() - interval '30 days'), 0)::int`,
      })
      .from(inquiryTable);

    const current = row?.current ?? 0;
    const prior = row?.prior ?? 0;
    return {
      currentValue: current,
      percentChange:
        prior > 0 ? Math.round(((current - prior) / prior) * 100) : null,
    };
  } catch (error) {
    console.error("Failed to fetch revenue delta:", error);
    return { currentValue: 0, percentChange: null };
  }
}

const QUEUE_TAG_COLOR = {
  aging: "var(--color-krs-champagne)",
  restock: "var(--color-krs-champagne)",
  review: "rgba(245,242,235,.5)",
};

/** Real, derivable "needs attention" items only — no fabricated bench/certificate rows without a system to back them. */
export async function getNeedsYouFirstQueue(): Promise<QueueItem[]> {
  await requireAdmin();
  try {
    const [agingInquiries, pendingReviews, restockProducts] =
      await Promise.all([
        db.query.inquiryTable.findMany({
          limit: 3,
          orderBy: [inquiryTable.createdAt],
          where: eq(inquiryTable.status, "pending"),
        }),
        db.query.productReviewTable.findMany({
          limit: 3,
          orderBy: [desc(productReviewTable.createdAt)],
          where: eq(productReviewTable.approved, false),
        }),
        db.query.productTable.findMany({
          limit: 2,
          where: and(
            eq(productTable.featured, true),
            eq(productTable.inStock, false),
          ),
        }),
      ]);

    const now = Date.now();
    const items: QueueItem[] = [];

    for (const inquiry of agingInquiries) {
      const days = Math.floor(
        (now - inquiry.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      items.push({
        href: `/admin/inquiries/${inquiry.id}`,
        meta: `${inquiry.customerName} · ${days} day${days === 1 ? "" : "s"} without reply`,
        tag: "Aging",
        tagColor: QUEUE_TAG_COLOR.aging,
        title: `Inquiry ${formatOrderNumber(inquiry.orderNumber)}`,
      });
    }

    for (const review of pendingReviews) {
      items.push({
        href: `/admin/reviews`,
        meta: `${review.rating} stars · ${review.customerName}`,
        tag: "Review",
        tagColor: QUEUE_TAG_COLOR.review,
        title: "Review awaiting approval",
      });
    }

    for (const product of restockProducts) {
      items.push({
        href: `/admin/products/${product.id}`,
        meta: "Featured piece, currently out of stock",
        tag: "Restock",
        tagColor: QUEUE_TAG_COLOR.restock,
        title: product.name,
      });
    }

    return items;
  } catch (error) {
    console.error("Failed to fetch needs-you-first queue:", error);
    return [];
  }
}
