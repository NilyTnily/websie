import "server-only";
import { desc, sql } from "drizzle-orm";

import type { Inquiry } from "~/db/schema";

import { db } from "~/db";
import {
  categoryTable,
  inquiryTable,
  productTable,
  userTable,
} from "~/db/schema";
import { requireAdmin } from "~/lib/admin";

export interface TopRequestedProduct {
  id: string;
  image: string;
  name: string;
  requestCount: number;
}

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
