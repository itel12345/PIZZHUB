// src/components/profile/page/ProfilePage.tsx
//
// The account dashboard. Guards against an unauthenticated visit —
// there's no user to show, so it redirects to "/" rather than
// rendering an empty/broken dashboard. Same hydration-safe pattern
// used by Checkout's empty-cart guard: check after mount, not during
// the render that runs before useAuth() has hydrated from storage.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";
import ProfileHeader from "../components/ProfileHeader";
import ProfileGrid from "../components/ProfileGrid";
import LogoutSection from "../components/LogoutSection";
import styles from "./ProfilePage.module.css";

export function ProfilePage() {
    const { user, isAuthenticated, isHydrated, logout } = useAuth();
  const router = useRouter();

useEffect(() => {
  // isHydrated is the inverse concept of the old isLoading — true once
  // AuthContext has finished checking localStorage, not while it's
  // still checking. !isLoading === isHydrated, so this condition
  // means the same thing it always did: "once we actually know the
  // auth state, and it's 'not authenticated', redirect."
  if (isHydrated && !isAuthenticated) {
    router.replace("/");
  }
}, [isHydrated, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

if (!isHydrated) {
  return null;
}

if (!isAuthenticated || !user) {
  return null;
}

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <ProfileHeader user={user} />

        <section className={styles.section} aria-labelledby="account-heading">
          <h2 id="account-heading" className={styles.sectionHeading}>
            Your Account
          </h2>
          <ProfileGrid />
        </section>

        <LogoutSection onLogout={handleLogout} />
      </div>
    </div>
  );
}