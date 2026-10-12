// src/components/admin/layout/AdminHeader/AdminHeader.tsx
//
// Reuses MobileMenuButton from the storefront Navbar rather than
// building a second hamburger icon — same component, same visuals,
// controlled here by AdminShell's drawer state.

"use client";

import MobileMenuButton from "@/components/layout/Navbar/MobileMenuButton";
import styles from "./AdminHeader.module.css";

interface AdminHeaderProps {
  isMenuOpen: boolean;
  onMenuClick: () => void;
}

export default function AdminHeader({ isMenuOpen, onMenuClick }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.menuButtonWrapper}>
        <MobileMenuButton isOpen={isMenuOpen} onToggle={onMenuClick} />
      </div>

      <div className={styles.userArea}>
        <span className={styles.userName}>Admin</span>
      </div>
    </header>
  );
}