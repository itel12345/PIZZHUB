// src/app/admin/products/error.tsx
//
// Next.js App Router convention: if AdminProductsPage (or anything it
// renders) throws, this replaces it instead of crashing the whole app.
// Must be a Client Component per Next.js's rules for error boundaries.

"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

interface ProductsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductsError({ error, reset }: ProductsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Couldn&apos;t load products</h2>
      <p className={styles.body}>
        Something went wrong fetching the menu from the database. This is
        usually temporary — try again.
      </p>
      <button type="button" className={styles.retryButton} onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}