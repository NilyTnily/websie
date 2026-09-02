import "server-only";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "~/db";
import { inquiryTable, userTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";

export interface AdminUserRow {
  createdAt: Date;
  email: string;
  emailVerified: boolean;
  id: string;
  inquiryCount: number;
  name: string;
  pendingAmount: number;
  phone: string | null;
  totalRequested: number;
  totalSpent: number; // delivered
}

export async function getAdminUsersWithSpending(search?: string): Promise<AdminUserRow[]> {
  try {
    await requireAdmin();
    const whereClause = search
      ? sql`(${userTable.email} ILIKE ${`%${search}%`} OR ${userTable.name} ILIKE ${`%${search}%`})`
      : undefined;

    const rows = await db
      .select({
        createdAt: userTable.createdAt,
        email: userTable.email,
        emailVerified: userTable.emailVerified,
        id: userTable.id,
        // aggregates from inquiry
        inquiryCount: sql<number>`count(${inquiryTable.id})::int`.as("inquiryCount"),
        name: userTable.name,
        pendingAmount: sql<number>`coalesce(sum(${inquiryTable.subtotal}) filter (where ${inquiryTable.status} = 'pending'), 0)::int`.as("pendingAmount"),
        phone: userTable.phone,
        totalRequested: sql<number>`coalesce(sum(${inquiryTable.subtotal}), 0)::int`.as("totalRequested"),
        totalSpent: sql<number>`coalesce(sum(${inquiryTable.subtotal}) filter (where ${inquiryTable.deliveryStatus} = 'delivered'), 0)::int`.as("totalSpent"),
      })
      .from(userTable)
      .leftJoin(inquiryTable, eq(inquiryTable.userId, userTable.id))
      .where(whereClause)
      .groupBy(userTable.id)
      .orderBy(desc(userTable.createdAt));

    return rows as AdminUserRow[];
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return [];
  }
}
