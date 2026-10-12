// src/app/admin/analytics/loading.tsx
//
// Renders automatically while AdminAnalyticsPage's
// getAnalyticsForAdmin() is in flight — same shimmer-skeleton pattern
// as admin/customers/loading.tsx and admin/orders/loading.tsx.

import styles from "./loading.module.css";

export default function LoadingAnalytics() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={`${styles.skeleton} ${styles.title}`} />
          <div className={`${styles.skeleton} ${styles.subtitle}`} />
        </div>
      </div>

      <div className={styles.statGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={`${styles.skeleton} ${styles.statCard}`} />
        ))}
      </div>

      <div className={`${styles.skeleton} ${styles.chart}`} />

      <div className={styles.splitRow}>
        <div className={`${styles.skeleton} ${styles.panel}`} />
        <div className={`${styles.skeleton} ${styles.panel}`} />
      </div>
    </div>
  );
}