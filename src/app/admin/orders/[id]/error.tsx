// src/app/admin/orders/[id]/error.tsx

"use client";

import { useEffect } from "react";
import styles from "../error.module.css";

interface OrderDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OrderDetailError({ error, reset }: OrderDetailErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Couldn&apos;t load this order</h2>
      <p className={styles.body}>
        Something went wrong fetching this order from the database. This is
        usually temporary — try again.
      </p>
      <button type="button" className={styles.retryButton} onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
