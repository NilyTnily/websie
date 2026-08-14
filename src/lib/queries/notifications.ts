import "server-only";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, inArray } from "drizzle-orm";

import type { NotificationRow } from "~/db/schema";

import { db } from "~/db";
import { notificationTable, userTable } from "~/db/schema";

export interface CreateNotificationInput {
  description: string;
  link?: string;
  title: string;
  type: NotificationRow["type"];
  userId: string;
}

export async function clearAllNotifications(userId: string): Promise<void> {
  await db
    .delete(notificationTable)
    .where(eq(notificationTable.userId, userId));
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  try {
    await db.insert(notificationTable).values({
      description: input.description,
      id: createId(),
      link: input.link ?? null,
      title: input.title,
      type: input.type,
      userId: input.userId,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function dismissNotification(
  id: string,
  userId: string,
): Promise<void> {
  await db
    .delete(notificationTable)
    .where(
      and(eq(notificationTable.id, id), eq(notificationTable.userId, userId)),
    );
}

export async function getNotificationsForUser(
  userId: string,
): Promise<NotificationRow[]> {
  try {
    return await db.query.notificationTable.findMany({
      limit: 30,
      orderBy: [desc(notificationTable.createdAt)],
      where: eq(notificationTable.userId, userId),
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notificationTable)
    .set({ read: true })
    .where(eq(notificationTable.userId, userId));
}

export async function markNotificationRead(
  id: string,
  userId: string,
): Promise<void> {
  await db
    .update(notificationTable)
    .set({ read: true })
    .where(
      and(eq(notificationTable.id, id), eq(notificationTable.userId, userId)),
    );
}

export async function notifyAdmins(
  input: Omit<CreateNotificationInput, "userId">,
): Promise<void> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return;

  try {
    const admins = await db.query.userTable.findMany({
      columns: { id: true },
      where: inArray(userTable.email, adminEmails),
    });
    await Promise.all(
      admins.map((admin) => createNotification({ ...input, userId: admin.id })),
    );
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}
