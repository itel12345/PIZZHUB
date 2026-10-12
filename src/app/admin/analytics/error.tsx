// src/app/admin/analytics/error.tsx
//
// Same pattern as admin/customers/error.tsx and admin/orders/error.tsx.

"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

interface AnalyticsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AnalyticsError({ error, reset }: AnalyticsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Couldn&apos;t load analytics</h2>
      <p className={styles.body}>
        Something went wrong computing analytics from the database. This is
        usually temporary — try again.
      </p>
      <button type="button" className={styles.retryButton} onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}