// src/components/profile/components/LogoutSection.tsx
//
// Logout kept as its own separate section at the bottom of the
// dashboard, deliberately not styled as another account card — a
// destructive/session-ending action shouldn't visually blend in with
// "go manage a thing" cards.

"use client";

import styles from "./LogoutSection.module.css";

interface LogoutSectionProps {
  onLogout: () => void;
}

export default function LogoutSection({ onLogout }: LogoutSectionProps) {
  return (
    <div className={styles.section}>
      <button type="button" className={styles.logoutButton} onClick={onLogout}>
        <LogoutIcon />
        Log Out
      </button>
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14 8l4 4-4 4M18 12H9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}