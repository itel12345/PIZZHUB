// src/components/profile/page/PaymentMethodsPage.tsx
//
// Same auth-guard pattern as ProfilePage.tsx, OrderHistoryPage.tsx, and
// SavedAddressesPage.tsx.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { PaymentMethodsList } from "../components/PaymentMethodsList";
import styles from "./PaymentMethodsPage.module.css";

export function PaymentMethodsPage() {
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
          <h1 className={styles.heading}>Payment Methods</h1>
          <p className={styles.subheading}>
            What PizzHub currently accepts at checkout.
          </p>
        </div>

        <PaymentMethodsList />
      </div>
    </div>
  );
}