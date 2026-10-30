// src/components/profile/page/SettingsPage.tsx
//
// Same auth-guard pattern as SavedAddressesPage.tsx/OrderHistoryPage.tsx.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { useAccountSettings } from "../hooks/useAccountSettings";
import { useProfilePicture } from "../hooks/useProfilePicture";
import { ProfilePictureSection } from "../components/settings/ProfilePictureSection";
import { AppearanceSection } from "../components/settings/AppearanceSection";
import { MarketingSection } from "../components/settings/MarketingSection";
import { SecuritySection } from "../components/settings/SecuritySection";
import { DangerZoneSection } from "../components/settings/DangerZoneSection";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  const { user, isAuthenticated, isHydrated, logout, refreshToken, updateUser } = useAuth();
  const router = useRouter();
  const {
    preferences,
    isLoading,
    hasError,
    retry,
    updatePreferences,
    changePassword,
    deleteAccount,
  } = useAccountSettings();

  // Changing your own password bumps authVersion server-side, which
  // invalidates this session's own token along with every other one
  // (see lib/account.ts's changeUserPassword) — the endpoint hands
  // back a freshly signed replacement specifically so this tab can
  // swap it in and keep working instead of getting logged out by its
  // own password change.
  const handleChangePassword = async (input: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const result = await changePassword(input);
    if (result.token) {
      refreshToken(result.token);
    }
    return result;
  };

  const { prepareAvatar, uploadAvatar, removeAvatar } = useProfilePicture();

  // The server has confirmed the change by now; this pushes it into the
  // shared auth state so the Navbar, mobile drawer and Profile header
  // all update at once and the persisted copy survives a refresh.
  const handleAvatarChanged = (avatarUrl: string | undefined) => {
    updateUser({ avatarUrl });
  };

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/");
    }
  }, [isHydrated, isAuthenticated, router]);

  const handleAccountDeleted = () => {
    logout();
    router.push("/");
  };

  if (!isHydrated || !isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/profile" className={styles.backLink}>
            ← Back to profile
          </Link>
          <h1 className={styles.heading}>Settings</h1>
          <p className={styles.subheading}>Manage how PizzHub looks and works for you.</p>
        </div>

        <ProfilePictureSection
          user={user}
          prepareAvatar={prepareAvatar}
          uploadAvatar={uploadAvatar}
          removeAvatar={removeAvatar}
          onChanged={handleAvatarChanged}
        />
        <AppearanceSection />

        <MarketingSection
          preferences={preferences}
          isLoading={isLoading}
          hasError={hasError}
          retry={retry}
          updatePreferences={updatePreferences}
        />

        <SecuritySection changePassword={handleChangePassword} />

        <DangerZoneSection deleteAccount={deleteAccount} onDeleted={handleAccountDeleted} />
      </div>
    </div>
  );
}
