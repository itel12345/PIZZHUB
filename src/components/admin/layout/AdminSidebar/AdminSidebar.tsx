// src/components/admin/layout/AdminSidebar/AdminSidebar.tsx
//
// Desktop-only static sidebar now — below the 900px breakpoint it's
// hidden entirely (see AdminSidebar.module.css) and AdminShell's
// MobileDrawer takes over navigation instead. No hooks of its own
// anymore, since the active-link logic now lives in AdminNavLinks.

import Link from "next/link";
import AdminNavLinks from "../AdminNavLinks/AdminNavLinks";
import styles from "./AdminSidebar.module.css";

export default function AdminSidebar() {
  return (
    <nav className={styles.sidebar} aria-label="Admin navigation">
      <Link href="/" className={styles.logo}>
        PizzHub <span className={styles.logoAccent}>Admin</span>
      </Link>

      <AdminNavLinks />
    </nav>
  );
}