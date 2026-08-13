"use client";

import { useRouter } from "next/navigation";
import React from "react";

import {
  clearAllNotificationsAction,
  dismissNotificationAction,
  getMyNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "~/app/actions/notifications";
import { useCurrentUser } from "~/lib/auth-client";

import type { Notification } from "./notification-center";

import { NotificationCenter } from "./notification-center";

const POLL_INTERVAL_MS = 30_000;

export function NotificationsWidget() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const refresh = React.useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const rows = await getMyNotificationsAction();
    setNotifications(
      rows.map((row) => ({
        description: row.description,
        id: row.id,
        link: row.link,
        read: row.read,
        timestamp: row.createdAt,
        title: row.title,
        type: row.type,
      })),
    );
  }, [user]);

  React.useEffect(() => {
    void refresh();
    if (!user) return;
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh, user]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    void markNotificationReadAction(id);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void markAllNotificationsReadAction();
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    void dismissNotificationAction(id);
  };

  const handleClearAll = () => {
    setNotifications([]);
    void clearAllNotificationsAction();
  };

  return (
    <NotificationCenter
      notifications={notifications}
      onClearAll={handleClearAll}
      onDismiss={handleDismiss}
      onMarkAllAsRead={handleMarkAllAsRead}
      onMarkAsRead={(id) => {
        handleMarkAsRead(id);
        const notification = notifications.find((n) => n.id === id);
        if (notification?.link) router.push(notification.link);
      }}
    />
  );
}
