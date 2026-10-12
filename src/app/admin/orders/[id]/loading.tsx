// src/app/admin/orders/[id]/loading.tsx

import styles from "../loading.module.css";

export default function LoadingOrderDetail() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={`${styles.skeleton} ${styles.title}`} />
          <div className={`${styles.skeleton} ${styles.subtitle}`} />
        </div>
      </div>

      <div className={styles.table}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={styles.row}>
            <div className={`${styles.skeleton} ${styles.line}`} />
            <div className={`${styles.skeleton} ${styles.lineShort}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
