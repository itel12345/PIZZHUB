// src/app/admin/orders/error.tsx
//
// Same pattern as admin/products/error.tsx.

"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

interface OrdersErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OrdersError({ error, reset }: OrdersErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Couldn&apos;t load orders</h2>
      <p className={styles.body}>
        Something went wrong fetching orders from the database. This is
        usually temporary — try again.
      </p>
      <button type="button" className={styles.retryButton} onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
