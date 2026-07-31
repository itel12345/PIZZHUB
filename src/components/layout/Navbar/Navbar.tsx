"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import styles from "./Navbar.module.css";

import NavbarLogo from "./NavbarLogo";
import NavbarCTA from "./NavbarCTA";
import NavbarLoginButton from "./NavbarLoginButton";
import NavbarSignupButton from "./NavbarSignupButton";
import MobileMenuButton from "./MobileMenuButton";

import { useFavorites } from "@/components/favorites";
import { useCart } from "@/components/cart";
import {
  useAuth,
  useAuthModal,
  AuthenticationModal,
} from "@/components/auth";

import FavoritesButton from "../NavActions/FavoritesButton";
import CartButton from "../NavActions/CartButton";
import AvatarButton from "../NavActions/AvatarButton";
import MobileNavLinks from "../NavActions/MobileNavLinks";
import { MobileDrawer } from "../NavActions/MobileDrawer";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const pathname = usePathname();
  const isHomepage = pathname === "/";

  const { isAuthenticated, user, isHydrated } = useAuth();

  const { favoriteCount } = useFavorites();
  const { itemCount: cartCount } = useCart();

  const authModal = useAuthModal();

  // Wait until auth has hydrated from localStorage.
  if (!isHydrated) {
    return null;
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <NavbarLogo />

        <div className={styles.desktopLinks}></div>

        <div className={styles.actions}>
          <div className={styles.authGroup}>
            {isAuthenticated && user ? (
              <>
                <FavoritesButton count={favoriteCount} />
                <CartButton count={cartCount} />
                <AvatarButton user={user} />
              </>
            ) : (
              <>
                <NavbarLoginButton onClick={authModal.openLogin} />
                <NavbarSignupButton onClick={authModal.openSignup} />
                {isHomepage && <NavbarCTA />}
              </>
            )}
          </div>

          <div className={styles.mobileOnly}>
            {isAuthenticated && user && (
              <>
                <FavoritesButton count={favoriteCount} />
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

      <MobileDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      >
        <MobileNavLinks
          onNavigate={() => setIsMenuOpen(false)}
          onOpenLogin={() => {
            setIsMenuOpen(false);
            authModal.openLogin();
          }}
          onOpenSignup={() => {
            setIsMenuOpen(false);
            authModal.openSignup();
          }}
        />
      </MobileDrawer>

      <AuthenticationModal
        isOpen={authModal.isOpen}
        view={authModal.view}
        onViewChange={authModal.setView}
        onClose={authModal.close}
      />
    </header>
  );
}