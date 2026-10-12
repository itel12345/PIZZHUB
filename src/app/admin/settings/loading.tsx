// src/app/admin/settings/loading.tsx
//
// Same shimmer-skeleton pattern as admin/customers/loading.tsx and
// admin/analytics/loading.tsx — shaped for stacked panels instead of a
// table or stat grid, since that's what this page actually renders.

import styles from "./loading.module.css";

export default function LoadingSettings() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={`${styles.skeleton} ${styles.title}`} />
          <div className={`${styles.skeleton} ${styles.subtitle}`} />
        </div>
      </div>

      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className={`${styles.skeleton} ${styles.panel}`} />
      ))}
    </div>
  );
}