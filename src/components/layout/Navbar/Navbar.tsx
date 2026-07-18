"use client";

import { useState } from "react";
import styles from "./Navbar.module.css";
import NavbarLogo from "./NavbarLogo";
import NavbarLinks from "./NavbarLinks";
import NavbarCTA from "./NavbarCTA";
import NavbarLoginButton from "./NavbarLoginButton";
import MobileMenuButton from "./MobileMenuButton";

/**
 * Navbar
 *
 * Top-level navigation bar. Composes the logo, primary nav
 * links, and CTA button into a single glassmorphic bar.
 *
 * Fully responsive: desktop shows the inline nav and auth
 * buttons; tablet reduces spacing; mobile hides the desktop
 * nav/actions behind a hamburger trigger that toggles a
 * collapsible panel reusing the same NavbarLinks,
 * NavbarLoginButton, and NavbarCTA components. Menu state is
 * owned here since this is the common parent of the trigger
 * and the panel it controls.
 */
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <NavbarLogo />

        <div className={styles.desktopLinks}>
          <NavbarLinks />
        </div>

        <div className={styles.actions}>
          <div className={styles.authGroup}>
            <NavbarLoginButton />
            <NavbarCTA />
          </div>
          <div className={styles.mobileOnly}>
            <MobileMenuButton
              isOpen={isMenuOpen}
              onToggle={() => setIsMenuOpen((open) => !open)}
            />
          </div>
        </div>
      </div>

      <div
        id="mobile-nav-panel"
        className={`${styles.mobilePanel} ${isMenuOpen ? styles.mobilePanelOpen : ""}`}
      >
        <NavbarLinks />
        <div className={styles.mobilePanelActions}>
          <NavbarLoginButton />
          <NavbarCTA />
        </div>
      </div>
    </header>
  );
}
