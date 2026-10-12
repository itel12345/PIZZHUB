// src/components/auth/hooks/useAuthModal.ts
//
// Reusable open/close controller for AuthenticationModal. Deliberately
// a plain hook (local useState), not a Context — the modal is only
// ever triggered from and rendered inside Navbar, so there's no need
// for cross-tree shared state the way Cart/Favorites need it. If a
// second trigger point (e.g. a "Sign in to save favorites" prompt
// elsewhere) is added later, THAT would be the moment to promote this
// into a Context — not before.

"use client";

import { useCallback, useState } from "react";
import type { AuthView } from "../types/auth";

export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  // Set when the modal was opened because a protected admin page
  // bounced the user here (see Navbar's `admin_auth_required` handling)
  // — consumed by LoginForm to navigate back after a successful login
  // instead of just closing the modal in place.
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const openLogin = useCallback((redirect?: string) => {
    setView("login");
    setRedirectTo(redirect ?? null);
    setIsOpen(true);
  }, []);

  const openSignup = useCallback(() => {
    setView("signup");
    setRedirectTo(null);
    setIsOpen(true);
  }, []);

  const openForgotPassword = useCallback(() => {
    setView("forgot-password");
    setRedirectTo(null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setRedirectTo(null);
  }, []);

  return {
    isOpen,
    view,
    redirectTo,
    setView,
    openLogin,
    openSignup,
    openForgotPassword,
    close,
  };
}