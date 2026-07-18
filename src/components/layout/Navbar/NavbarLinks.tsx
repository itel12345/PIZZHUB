"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

/**
 * Primary navigation destinations.
 */
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/**
 * NavbarLinks
 *
 * Renders the primary navigation. Used in both the desktop
 * inline nav and the mobile panel (see Navbar.tsx) — each
 * instance independently reads the current route via
 * usePathname to highlight the active link.
 */
export default function NavbarLinks() {
  const pathname = usePathname();

  return (
    <nav className={styles.links} aria-label="Primary">
      {NAV_LINKS.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
