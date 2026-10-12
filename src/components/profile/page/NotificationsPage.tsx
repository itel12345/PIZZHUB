// src/components/profile/page/NotificationsPage.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { NotificationsList } from "../components/NotificationsList";
import styles from "./NotificationsPage.module.css";

export function NotificationsPage() {
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
          <h1 className={styles.heading}>Notifications</h1>
          <p className={styles.subheading}>Updates about your orders and payments.</p>
        </div>

        <NotificationsList />
      </div>
    </div>
  );
}