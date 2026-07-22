// src/components/layout/NavActions/MobileNavLinks.tsx
// Full mobile-menu link list, matching the spec's requested order:
// Home, Menu, About, Contact, then Favorites/Cart (with counts), then
// Profile + Logout when authenticated, or Login/Sign Up when not.
//
// This is meant to render *inside* the existing mobile drawer/hamburger
// panel — it does not own the open/close state or the panel chrome itself,
// since that already lives in the current Navbar.

"use client";

import Link from "next/link";
import { useAuthState } from "./useAuthState";
import { useNavCounts } from "./useNavCounts";
import styles from "./MobileNavLinks.module.css";

interface MobileNavLinksProps {
  onNavigate?: () => void;
}

const PRIMARY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function MobileNavLinks({ onNavigate }: MobileNavLinksProps) {
  const { isAuthenticated, user } = useAuthState();
  const { cartCount, favoritesCount } = useNavCounts();

  return (
    <nav className={styles.nav} aria-label="Mobile">
      <ul className={styles.primaryList}>
        {PRIMARY_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={styles.link} onClick={onNavigate}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.divider} aria-hidden="true" />

      <ul className={styles.secondaryList}>
        <li>
          <Link href="/favorites" className={styles.link} onClick={onNavigate}>
            <span>Favorites</span>
            <span className={styles.count}>{favoritesCount}</span>
          </Link>
        </li>
        <li>
          <Link href="/cart" className={styles.link} onClick={onNavigate}>
            <span>Cart</span>
            <span className={styles.count}>{cartCount}</span>
          </Link>
        </li>
      </ul>

      <div className={styles.divider} aria-hidden="true" />

      {isAuthenticated && user ? (
        <ul className={styles.secondaryList}>
          <li>
            <Link href="/profile" className={styles.link} onClick={onNavigate}>
              Profile
            </Link>
          </li>
          <li>
            {/* TODO: wire to Auth.js sign-out once configured */}
            <button type="button" className={styles.logoutButton}>
              Logout
            </button>
          </li>
        </ul>
      ) : (
        <ul className={styles.secondaryList}>
          <li>
            <Link href="/login" className={styles.link} onClick={onNavigate}>
              Login
            </Link>
          </li>
          <li>
            <Link href="/signup" className={styles.signUpLink} onClick={onNavigate}>
              Sign Up
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
}