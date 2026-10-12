// src/lib/notifications.ts
//
// createNotification() is deliberately best-effort: it catches and
// logs its own failures rather than throwing. A notification is a
// side effect of a real order/payment event, never a dependency that
// event should fail on — a payment confirming successfully must never
// be rolled back or reported as failed just because the notification
// insert had a hiccup.

import "server-only";
import { prisma } from "./prisma";
import { NotificationType } from "@/generated/prisma/client";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: Date;
}

function toNotificationDTO(row: NotificationRow): NotificationDTO {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    orderId: row.orderId,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

export class NotificationNotFoundError extends Error {}

interface ListNotificationsParams {
  userId: string;
  page: number;
  pageSize: number;
}

export async function listNotificationsForUser({
  userId,
  page,
  pageSize,
}: ListNotificationsParams): Promise<{
  notifications: NotificationDTO[];
  total: number;
  unreadCount: number;
}> {
  const where = { userId };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications: notifications.map(toNotificationDTO), total, unreadCount };
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<NotificationDTO> {
  const existing = await prisma.notification.findUnique({ where: { id: notificationId } });

  if (!existing || existing.userId !== userId) {
    throw new NotificationNotFoundError("Notification not found.");
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return toNotificationDTO(updated);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function deleteNotificationForUser(
  userId: string,
  notificationId: string
): Promise<void> {
  const existing = await prisma.notification.findUnique({ where: { id: notificationId } });

  if (!existing || existing.userId !== userId) {
    throw new NotificationNotFoundError("Notification not found.");
  }

  await prisma.notification.delete({ where: { id: notificationId } });
}

export async function clearAllNotificationsForUser(userId: string): Promise<void> {
  await prisma.notification.deleteMany({ where: { userId } });
}

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
}

/**
 * The only place a Notification row is ever created. Called
 * exclusively from lib/orders.ts, at the exact moment one of five real
 * order/payment events happens — never speculatively, never for
 * demo/UI purposes. See lib/orders.ts for the specific call sites.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        orderId: params.orderId,
      },
    });
  } catch (error) {
    console.error("Failed to create notification (non-fatal):", error);
  }
}