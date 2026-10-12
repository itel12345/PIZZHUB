// src/components/admin/layout/AdminShell/AdminShell.tsx
//
// Owns the one piece of state the whole admin shell needs: whether the
// mobile nav drawer is open. AdminHeader's hamburger toggles it,
// AdminNavLinks (rendered inside the drawer) closes it after a real
// navigation. The desktop sidebar (AdminSidebar) doesn't care about
// this state at all — it just hides itself via CSS below 900px.

"use client";

import { useState } from "react";
import AdminSidebar from "../AdminSidebar/AdminSidebar";
import AdminHeader from "../AdminHeader/AdminHeader";
import AdminNavLinks from "../AdminNavLinks/AdminNavLinks";
import { MobileDrawer } from "@/components/layout/NavActions/MobileDrawer";
import styles from "./AdminShell.module.css";

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <AdminSidebar />

      <div className={styles.main}>
        <AdminHeader
          isMenuOpen={isMenuOpen}
          onMenuClick={() => setIsMenuOpen((open) => !open)}
        />
        <div className={styles.content}>{children}</div>
      </div>

      <MobileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <AdminNavLinks onNavigate={() => setIsMenuOpen(false)} />
      </MobileDrawer>
    </div>
  );
}