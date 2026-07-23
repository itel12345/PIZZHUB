"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "./useAuthState";
import styles from "./MobileNavLinks.module.css";

interface MobileNavLinksProps {
  onNavigate?: () => void;
}

interface NavItem {
  href: string;
  label: string;
}

const PRIMARY_LINKS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
];

const SECONDARY_LINKS: NavItem[] = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/**
 * MobileNavLinks
 *
 * Content rendered inside the mobile drawer. Per the Phase 4 spec, this is
 * navigation pages ONLY: Home, Menu, About, Contact, Profile. Favorites and
 * Cart are deliberately NOT repeated here — they're already permanently
 * visible next to the hamburger once logged in (see Navbar.tsx), and
 * "Order Now" belongs only to the homepage hero. Duplicating either here
 * would undo the whole point of this redesign.
 */
export default function MobileNavLinks({ onNavigate }: MobileNavLinksProps) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthState();

  return (
    <nav aria-label="Mobile" className={styles.nav}>
      <ul className={styles.group}>
        <NavRow
          href="/"
          label="Home"
          icon={<HomeIcon />}
          isActive={pathname === "/"}
          onNavigate={onNavigate}
        />
        <NavRow
          href="/menu"
          label="Menu"
          icon={<MenuIcon />}
          isActive={pathname === "/menu"}
          onNavigate={onNavigate}
        />
      </ul>

      <div className={styles.divider} aria-hidden="true" />

      <ul className={styles.group}>
        <NavRow
          href="/about"
          label="About"
          icon={<InfoIcon />}
          isActive={pathname === "/about"}
          onNavigate={onNavigate}
        />
        <NavRow
          href="/contact"
          label="Contact"
          icon={<ContactIcon />}
          isActive={pathname === "/contact"}
          onNavigate={onNavigate}
        />
      </ul>

      <div className={styles.divider} aria-hidden="true" />

      <ul className={styles.group}>
        <NavRow
          href="/profile"
          label="Profile"
          icon={<ProfileIcon />}
          isActive={pathname === "/profile"}
          onNavigate={onNavigate}
        />
      </ul>

      {/* Pushes the auth section to the bottom of the drawer. */}
      <div className={styles.spacer} />

      <div className={styles.divider} aria-hidden="true" />

      {isAuthenticated && user ? (
        <div className={styles.authSection}>
          <div className={styles.identity}>
            <span className={styles.identityAvatar} aria-hidden="true">
              {user.name.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <span className={styles.identityName}>{user.name}</span>
          </div>

          <Link href="/profile" onClick={onNavigate} className={styles.row}>
            <span className={styles.icon}>
              <ProfileIcon />
            </span>
            <span className={styles.label}>Profile</span>
          </Link>

          {/* No /settings route yet — placeholder per spec, clearly marked
              rather than linking somewhere misleading. */}
          <button type="button" className={`${styles.row} ${styles.rowDisabled}`} disabled>
            <span className={styles.icon}>
              <SettingsIcon />
            </span>
            <span className={styles.label}>Settings</span>
            <span className={styles.soonTag}>Soon</span>
          </button>

          {/* TODO: wire to Auth.js sign-out once configured */}
          <button type="button" className={styles.row} onClick={onNavigate}>
            <span className={styles.icon}>
              <LogoutIcon />
            </span>
            <span className={styles.label}>Logout</span>
          </button>
        </div>
      ) : (
        <div className={styles.authSection}>
          <Link href="/login" onClick={onNavigate} className={styles.loginLink}>
            Login
          </Link>
          <Link href="/signup" onClick={onNavigate} className={styles.signUpLink}>
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ============================================
   NavRow — a single navigable drawer item, with the active-page pill
   ============================================ */

interface NavRowProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onNavigate?: () => void;
}

function NavRow({ href, label, icon, isActive, onNavigate }: NavRowProps) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={`${styles.row} ${isActive ? styles.rowActive : ""}`}
        aria-current={isActive ? "page" : undefined}
      >
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </Link>
    </li>
  );
}

/* ============================================
   Icons — small, consistent stroke-style line icons matching the rest of
   the app's SVG icon language (SearchBar, FavoriteButton, etc.) rather
   than emoji, for a more deliberate/premium feel.
   ============================================ */

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6.5h16M4 12h11M4 17.5h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 19.5c1.2-3.3 4-5 7-5s5.8 1.7 7 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.8 6.8l1.4 1.4M15.8 15.8l1.4 1.4M6.8 17.2l1.4-1.4M15.8 8.2l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
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
      <path d="M14 8l4 4-4 4M18 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}