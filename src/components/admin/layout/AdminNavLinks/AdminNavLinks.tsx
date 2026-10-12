// src/components/admin/layout/AdminNavLinks/AdminNavLinks.tsx
//
// Extracted out of AdminSidebar so the exact same nav list can be
// rendered twice — once statically in the desktop sidebar, once inside
// the mobile drawer — without duplicating the NAV_ITEMS array or the
// active-link logic in two places.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminNavLinks.module.css";

interface NavItem {
  label: string;
  href: string;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Settings", href: "/admin/settings" },
];

interface AdminNavLinksProps {
  /** Called after a real nav link is clicked — used to close the mobile drawer. */
  onNavigate?: () => void;
}

export default function AdminNavLinks({ onNavigate }: AdminNavLinksProps) {
  const pathname = usePathname();

  return (
    <ul className={styles.list}>
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname?.startsWith(item.href);

        if (item.comingSoon) {
          return (
            <li key={item.href}>
              <span className={styles.itemDisabled}>
                {item.label}
                <span className={styles.badge}>Soon</span>
              </span>
            </li>
          );
        }

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}