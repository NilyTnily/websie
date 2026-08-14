"use server";

import { getCurrentUser } from "~/lib/auth";
import {
  clearAllNotifications,
  dismissNotification,
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "~/lib/queries/notifications";

export async function clearAllNotificationsAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await clearAllNotifications(user.id);
}

export async function dismissNotificationAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await dismissNotification(id, user.id);
}

export async function getMyNotificationsAction() {
  const user = await getCurrentUser();
  if (!user) return [];
  return getNotificationsForUser(user.id);
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await markAllNotificationsRead(user.id);
}

export async function markNotificationReadAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await markNotificationRead(id, user.id);
}
