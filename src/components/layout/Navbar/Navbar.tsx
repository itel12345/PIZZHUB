"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import NavbarLogo from "./NavbarLogo";
import NavbarCTA from "./NavbarCTA";
import NavbarLoginButton from "./NavbarLoginButton";
import NavbarSignupButton from "./NavbarSignupButton";
import MobileMenuButton from "./MobileMenuButton";
import { useAuthState } from "../NavActions/useAuthState";
import { useNavCounts } from "../NavActions/useNavCounts";
import FavoritesButton from "../NavActions/FavoritesButton";
import CartButton from "../NavActions/CartButton";
import AvatarButton from "../NavActions/AvatarButton";
import MobileNavLinks from "../NavActions/MobileNavLinks";


/**
 * Navbar
 *
 * Top-level navigation bar. Composes the logo, primary nav links, and the
 * auth-aware action group into a single glassmorphic bar.
 *
 * Auth-aware action group (desktop, in .authGroup):
 *   Logged out -> Login, Sign Up, and Order Now (Order Now only on "/")
 *   Logged in  -> Favorites, Cart, Avatar (Order Now never shows once logged in —
 *                 the cart becomes the primary CTA at that point)
 *
 * "Order Now" is homepage-only because every other page already places the
 * customer inside the ordering flow (menu, cart, etc.) — the homepage hero
 * is the only place that still needs to prompt someone to start ordering.
 *
 * Auth state and cart/favorites counts are mocked via useAuthState /
 * useNavCounts for now (see those hooks for the real-data upgrade path).
 *
 * Fully responsive: desktop shows the inline nav and actions; tablet
 * reduces spacing; mobile hides the desktop nav/actions behind a hamburger
 * trigger that toggles a collapsible panel containing MobileNavLinks
 * (the full mobile link list, including Favorites/Cart counts and the
 * auth-aware bottom section). Menu open/close state is owned here since
 * this is the common parent of the trigger and the panel it controls.
 */
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  const { isAuthenticated, user } = useAuthState();
  const { cartCount, favoritesCount } = useNavCounts();

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <NavbarLogo />

        <div className={styles.desktopLinks}>
        </div>

        <div className={styles.actions}>
          <div className={styles.authGroup}>
            {isAuthenticated && user ? (
              <>
                <FavoritesButton count={favoritesCount} />
                <CartButton count={cartCount} />
                <AvatarButton user={user} />
              </>
            ) : (
              <>
                <NavbarLoginButton />
                <NavbarSignupButton />
                {isHomepage && <NavbarCTA />}
              </>
            )}
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
        <MobileNavLinks onNavigate={() => setIsMenuOpen(false)} />
      </div>
    </header>
  );
}