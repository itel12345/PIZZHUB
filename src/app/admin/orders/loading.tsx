// src/app/admin/orders/loading.tsx
//
// Renders automatically while AdminOrdersPage's getOrdersForAdmin() is
// in flight — same pattern as admin/products/loading.tsx.

import styles from "./loading.module.css";

export default function LoadingOrders() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={`${styles.skeleton} ${styles.title}`} />
          <div className={`${styles.skeleton} ${styles.subtitle}`} />
        </div>
      </div>

      <div className={styles.table}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={styles.row}>
            <div className={`${styles.skeleton} ${styles.line}`} />
            <div className={`${styles.skeleton} ${styles.lineShort}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
