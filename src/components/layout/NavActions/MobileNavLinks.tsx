"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth";
import { useAccountPanel, ACCOUNT_MENU_ITEMS } from "@/components/profile";
import styles from "./MobileNavLinks.module.css";

interface MobileNavLinksProps {
  /** Whether the parent drawer is currently open — used to reset the
   *  account panel back to the nav view whenever the drawer closes, so
   *  reopening it never surprises the user with the account panel
   *  still showing from last time. */
  isOpen?: boolean;
  onNavigate?: () => void;
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
}

/**
 * MobileNavLinks
 *
 * Content rendered inside the mobile drawer. Phase 4 shape: Home, Menu,
 * About, Contact as flat nav rows.
 *
 * Phase 5 change: tapping "Profile" (when logged in) no longer
 * navigates directly. Instead it slides in a second panel — the
 * account panel — containing avatar/name/email plus the full account
 * menu (My Profile, Orders, Saved Addresses, Payment Methods,
 * Notifications, Settings) and Logout, exactly like iOS Settings
 * drilling into a sub-page. The Back arrow returns to the nav panel
 * without closing the drawer. When logged out, Login/Sign Up still
 * open AuthenticationModal directly (unchanged from the auth phase).
 *
 * The two panels are two full-width children inside a horizontally
 * sliding track (transform: translateX only — GPU-accelerated, no
 * layout thrashing), toggled by useAccountPanel().
 */
export default function MobileNavLinks({
  isOpen,
  onNavigate,
  onOpenLogin,
  onOpenSignup,
}: MobileNavLinksProps): import("react").JSX.Element {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const { isAccountPanelOpen, openAccountPanel, closeAccountPanel } =
    useAccountPanel();

  // Reset to the nav panel whenever the drawer itself closes, so it
  // never reopens mid-account-panel unexpectedly.
  useEffect(() => {
    if (!isOpen) {
      closeAccountPanel();
    }
  }, [isOpen, closeAccountPanel]);

  const handleLogout = () => {
    logout();
    onNavigate?.();
  };

  return (
    <nav aria-label="Mobile" className={styles.nav}>
      <div className={styles.panelsViewport}>
        <div
          className={`${styles.panelsTrack} ${
            isAccountPanelOpen ? styles.trackShiftedToAccount : ""
          }`}
        >
          {/* ============ PANEL 1 — Navigation ============ */}
          <div
            className={styles.panel}
            aria-hidden={isAccountPanelOpen}
            inert={isAccountPanelOpen ? true : undefined}
          >
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

            {/* Pushes the auth/profile trigger to the bottom of the drawer. */}
            <div className={styles.spacer} />

            <div className={styles.divider} aria-hidden="true" />

            {isAuthenticated && user ? (
              <div className={styles.authSection}>
                <button
                  type="button"
                  className={styles.profileTrigger}
                  onClick={openAccountPanel}
                  aria-haspopup="true"
                >
                  <span className={styles.identityAvatar} aria-hidden="true">
                    {user.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <span className={styles.profileTriggerText}>
                    <span className={styles.identityName}>{user.name}</span>
                    <span className={styles.profileTriggerHint}>
                      View account
                    </span>
                  </span>
                  <span className={styles.chevron} aria-hidden="true">
                    <ChevronRightIcon />
                  </span>
                </button>
              </div>
            ) : (
              <div className={styles.authSection}>
                <button
                  type="button"
                  onClick={() => onOpenLogin?.()}
                  className={styles.loginLink}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSignup?.()}
                  className={styles.signUpLink}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* ============ PANEL 2 — Account ============ */}
          <div
            className={styles.panel}
            aria-hidden={!isAccountPanelOpen}
            inert={!isAccountPanelOpen ? true : undefined}
          >
            {user && (
              <>
                <div className={styles.accountHeader}>
                  <button
                    type="button"
                    className={styles.backButton}
                    onClick={closeAccountPanel}
                    aria-label="Back to menu"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <span className={styles.accountHeaderTitle}>Account</span>
                </div>

                <div className={styles.accountIdentity}>
                  <span className={styles.accountAvatar} aria-hidden="true">
                    {user.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <span className={styles.accountName}>{user.name}</span>
                  {user.email && (
                    <span className={styles.accountEmail}>{user.email}</span>
                  )}
                </div>

                <div className={styles.divider} aria-hidden="true" />

                <ul className={styles.group}>
                  {ACCOUNT_MENU_ITEMS.map((item) =>
                    item.isAvailable ? (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={styles.row}
                        >
                          <span className={styles.label}>{item.label}</span>
                        </Link>
                      </li>
                    ) : (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`${styles.row} ${styles.rowDisabled}`}
                          disabled
                        >
                          <span className={styles.label}>{item.label}</span>
                          <span className={styles.soonTag}>Soon</span>
                        </button>
                      </li>
                    )
                  )}
                </ul>

                <div className={styles.divider} aria-hidden="true" />

                <button
                  type="button"
                  className={styles.logoutRow}
                  onClick={handleLogout}
                >
                  <LogoutIcon />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
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

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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