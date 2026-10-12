// src/components/profile/page/SavedAddressesPage.tsx
//
// Same auth-guard pattern as ProfilePage.tsx and OrderHistoryPage.tsx.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { AddressList } from "../components/AddressList";
import styles from "./SavedAddressesPage.module.css";

export function SavedAddressesPage() {
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
          <h1 className={styles.heading}>Saved Addresses</h1>
          <p className={styles.subheading}>Manage the addresses you deliver to.</p>
        </div>

        <AddressList />
      </div>
    </div>
  );
}