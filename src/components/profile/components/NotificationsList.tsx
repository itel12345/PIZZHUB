// src/components/profile/components/NotificationsList.tsx

"use client";

import { useNotifications, type Notification } from "@/components/notifications";
import styles from "./NotificationsList.module.css";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function NotificationRow({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
}) {
  return (
    <li className={`${styles.row} ${notification.isRead ? "" : styles.unread}`}>
      <button
        type="button"
        className={styles.rowMain}
        onClick={notification.isRead ? undefined : onMarkAsRead}
        disabled={notification.isRead}
        aria-label={notification.isRead ? undefined : "Mark as read"}
      >
        {!notification.isRead ? <span className={styles.unreadDot} aria-hidden="true" /> : null}
        <div className={styles.rowText}>
          <span className={styles.title}>{notification.title}</span>
          <span className={styles.message}>{notification.message}</span>
          <span className={styles.timestamp}>{formatTimestamp(notification.createdAt)}</span>
        </div>
      </button>

      <button
        type="button"
        className={styles.deleteButton}
        onClick={onDelete}
        aria-label="Delete notification"
      >
        ×
      </button>
    </li>
  );
}

function NotificationsSkeleton() {
  return (
    <ul className={styles.list} aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index} className={`${styles.row} ${styles.skeletonRow}`} />
      ))}
    </ul>
  );
}

export function NotificationsList() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasError,
    page,
    totalPages,
    goToPage,
    retry,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  if (isLoading) {
    return <NotificationsSkeleton />;
  }

  if (hasError) {
    return (
      <div className={styles.empty}>
        <p>Couldn&apos;t load your notifications. This is usually temporary.</p>
        <button type="button" className={styles.retryButton} onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.empty}>
        <p>You don&apos;t have any notifications yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <span className={styles.unreadSummary}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </span>
        <div className={styles.toolbarActions}>
          {unreadCount > 0 ? (
            <button type="button" className={styles.linkButton} onClick={markAllAsRead}>
              Mark all as read
            </button>
          ) : null}
          <button
            type="button"
            className={`${styles.linkButton} ${styles.clearButton}`}
            onClick={() => {
              if (window.confirm("Clear all notifications? This can't be undone.")) {
                void clearAll();
              }
            }}
          >
            Clear all
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onMarkAsRead={() => void markAsRead(notification.id)}
            onDelete={() => void deleteNotification(notification.id)}
          />
        ))}
      </ul>

      {totalPages > 1 ? (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageButton}
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            ← Previous
          </button>
          <span className={styles.pageStatus}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageButton}
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  );
}