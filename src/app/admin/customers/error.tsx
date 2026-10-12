// src/app/admin/customers/error.tsx
//
// Same pattern as admin/orders/error.tsx.

"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

interface CustomersErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CustomersError({ error, reset }: CustomersErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Couldn&apos;t load customers</h2>
      <p className={styles.body}>
        Something went wrong fetching customers from the database. This is
        usually temporary — try again.
      </p>
      <button type="button" className={styles.retryButton} onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}