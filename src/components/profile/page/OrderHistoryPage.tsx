// src/components/profile/page/OrderHistoryPage.tsx
//
// Same auth-guard pattern as ProfilePage.tsx (this file's sibling) —
// redirect to "/" once we know for certain there's no authenticated
// user, never while auth is still hydrating from storage.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { OrderHistoryList } from "../components/OrderHistoryList";
import styles from "./OrderHistoryPage.module.css";

export function OrderHistoryPage() {
  const { isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/");
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/profile" className={styles.backLink}>
            ← Back to profile
          </Link>
          <h1 className={styles.heading}>Order History</h1>
          <p className={styles.subheading}>Everything you&apos;ve ordered from us.</p>
        </div>

        <OrderHistoryList />
      </div>
    </div>
  );
}