"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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

  const { isAuthenticated, user } = useAuth();

  const { favoriteCount } = useFavorites();
  const { itemCount: cartCount } = useCart();

  const authModal = useAuthModal();
  const router = useRouter();

  // If middleware bounced an unauthenticated admin request here (see
  // middleware.ts denyAccess), auto-open the login modal and remember
  // where they were headed so a successful login sends them straight
  // back — instead of leaving them stranded on the homepage with no
  // indication why they landed here.
  //
  // Reads window.location.search directly rather than
  // next/navigation's useSearchParams(): that hook forces this
  // component (rendered globally, in every layout) into Next's dynamic
  // rendering + Suspense-boundary requirements just to read two query
  // params once on mount. A plain browser API read in an effect avoids
  // that without losing anything — this only ever needs to run once,
  // client-side, right after the page lands.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin_auth_required") !== "1") return;

    const redirectTarget = params.get("redirect");
    authModal.openLogin(redirectTarget ?? undefined);

    // Strip the params so refreshing or sharing the URL doesn't
    // re-trigger the modal, and so the URL doesn't stay cluttered.
    params.delete("admin_auth_required");
    params.delete("redirect");
    const cleanedQuery = params.toString();
    router.replace(
      cleanedQuery ? `${pathname}?${cleanedQuery}` : pathname,
      { scroll: false }
    );
    // Intentionally runs once on mount only — this is a one-time
    // "how did I get here" check, not something that should re-fire
    // as authModal's identity changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No isHydrated gate here anymore: `user` starts as `null` on both
  // the server and the client's very first render (see
  // AuthContext.tsx), so `isAuthenticated && user` below already
  // renders the correct, hydration-safe "logged out" navbar
  // immediately — no blank flash while waiting for hydration. Once the
  // session-restore effect in AuthContext runs, this re-renders with
  // the real logged-in state, same as any other post-hydration update.
  //
  // Previously this returned `null` until isHydrated flipped true,
  // which meant the ENTIRE navbar vanished for a moment on every hard
  // refresh — that's what was actually causing "lazy load" on refresh,
  // not a data-loading issue.

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
                <NavbarLoginButton onClick={() => authModal.openLogin()} />
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
        redirectTo={authModal.redirectTo}
        onViewChange={authModal.setView}
        onClose={authModal.close}
      />
    </header>
  );
}