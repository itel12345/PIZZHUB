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
import { MobileDrawer } from "../NavActions/MobileDrawer";

/**
 * Navbar
 *
 * Top-level navigation bar. Composes the logo, primary nav links, and the
 * auth-aware action group into a single glassmorphic bar.
 *
 * Desktop (.authGroup, unchanged from before this phase):
 *   Logged out -> Login, Sign Up, and Order Now (Order Now only on "/")
 *   Logged in  -> Favorites, Cart, Avatar (Order Now never shows once logged in)
 *
 * Mobile (Phase 4 redesign — .mobileOnly):
 *   Logged out -> just the hamburger (no Login/Sign Up/Order Now in the bar —
 *                 those live inside the drawer instead)
 *   Logged in  -> Favorites, Cart, then the hamburger — permanently visible
 *                 on every page once logged in, so the drawer itself never
 *                 needs to repeat them
 *
 * Tapping the hamburger opens MobileDrawer, a left-side sliding panel
 * (transform/opacity only) containing MobileNavLinks — Home/Menu/About/
 * Contact/Profile plus the auth-aware bottom section. Favorites, Cart,
 * and Order Now are deliberately never shown inside the drawer, since
 * they're either already in the bar or belong only to the homepage hero.
 *
 * Auth state and cart/favorites counts are mocked via useAuthState /
 * useNavCounts for now (see those hooks for the real-data upgrade path).
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
            {isAuthenticated && user && (
              <>
                <FavoritesButton count={favoritesCount} />
                <CartButton count={cartCount} />
              </>
            )}
            <MobileMenuButton
              isOpen={isMenuOpen}
              onToggle={() => setIsMenuOpen((open) => !open)}
            />
          </div>
        </div>
      </div>

      <MobileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <MobileNavLinks onNavigate={() => setIsMenuOpen(false)} />
      </MobileDrawer>
    </header>
  );
}