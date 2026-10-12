// src/app/admin/settings/error.tsx
//
// Same pattern as admin/customers/error.tsx and admin/analytics/error.tsx.

"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

interface SettingsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SettingsError({ error, reset }: SettingsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Couldn&apos;t load settings</h2>
      <p className={styles.body}>
        Something went wrong loading the store settings. This is usually
        temporary — try again.
      </p>
      <button type="button" className={styles.retryButton} onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}