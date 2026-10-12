// src/app/admin/products/loading.tsx
//
// Next.js renders this automatically while AdminProductsPage's
// prisma.pizza.findMany() is in flight — no wiring needed beyond this
// file existing. Shape roughly matches the real table so it doesn't
// visually jump when the data arrives.

import styles from "./loading.module.css";

export default function LoadingProducts() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={`${styles.skeleton} ${styles.title}`} />
          <div className={`${styles.skeleton} ${styles.subtitle}`} />
        </div>
        <div className={`${styles.skeleton} ${styles.button}`} />
      </div>

      <div className={styles.table}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={styles.row}>
            <div className={`${styles.skeleton} ${styles.thumb}`} />
            <div className={`${styles.skeleton} ${styles.line}`} />
            <div className={`${styles.skeleton} ${styles.lineShort}`} />
          </div>
        ))}
      </div>
    </div>
  );
}