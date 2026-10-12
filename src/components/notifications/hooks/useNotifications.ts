// src/components/notifications/hooks/useNotifications.ts
//
// Same Bearer-token fetch pattern as useOrders/useAddresses.

"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredAuthToken } from "@/components/auth";
import type { NotificationDTO } from "@/lib/notifications";

export type Notification = NotificationDTO;

const PAGE_SIZE = 20;

function authHeaders(): HeadersInit {
  const token = getStoredAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface UseNotificationsResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  hasError: boolean;
  goToPage: (page: number) => void;
  retry: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);
  const goToPage = useCallback((nextPage: number) => {
    setPage(nextPage < 1 ? 1 : nextPage);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchNotifications() {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(
          `/api/notifications?page=${page}&pageSize=${PAGE_SIZE}`,
          { headers: authHeaders() }
        );

        if (cancelled) return;

        if (!response.ok) {
          setHasError(true);
          setNotifications([]);
          setTotal(0);
          setUnreadCount(0);
          return;
        }

        const data = (await response.json()) as {
          notifications: Notification[];
          total: number;
          unreadCount: number;
        };

        if (cancelled) return;

        setNotifications(data.notifications);
        setTotal(data.total);
        setUnreadCount(data.unreadCount);
      } catch {
        if (!cancelled) {
          setHasError(true);
          setNotifications([]);
          setTotal(0);
          setUnreadCount(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, [page, retryKey]);

  const markAsRead = useCallback(async (id: string) => {
    const response = await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    if (!response.ok) return;

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: authHeaders(),
    });
    if (!response.ok) return;

    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const response = await fetch(`/api/notifications/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!response.ok) return;

    setNotifications((current) => {
      const target = current.find((notification) => notification.id === id);
      if (target && !target.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return current.filter((notification) => notification.id !== id);
    });
    setTotal((count) => Math.max(0, count - 1));
  }, []);

  const clearAll = useCallback(async () => {
    const response = await fetch("/api/notifications", {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!response.ok) return;

    setNotifications([]);
    setTotal(0);
    setUnreadCount(0);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    notifications,
    total,
    unreadCount,
    page,
    totalPages,
    isLoading,
    hasError,
    goToPage,
    retry,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}