// src/components/auth/modal/AuthenticationModal.tsx
//
// The single reusable modal housing Login, Signup, and Forgot Password.
// Renders via createPortal(document.body) — the same fix already
// applied to MobileDrawer, since position:fixed only reliably positions
// against the true viewport when portaled straight into <body>, not
// left nested under whatever markup happens to surround it on a given
// page.
//
// Stays mounted briefly after `isOpen` goes false so the closing
// animation (reverse of the opening slide/scale/fade) can actually
// play, instead of the panel just vanishing instantly.

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import type { AuthView } from "../types/auth";
import AuthHeader from "../components/AuthHeader";
import LoginForm from "../forms/LoginForm";
import SignupForm from "../forms/SignupForm";
import ForgotPasswordForm from "../forms/ForgotPasswordForm";
import styles from "./AuthenticationModal.module.css";

interface AuthenticationModalProps {
  isOpen: boolean;
  view: AuthView;
  /** Where to send the user after a successful login, if they were
   *  bounced here from a protected admin page. Undefined/null for a
   *  normal, unprompted login — in that case the modal just closes. */
  redirectTo?: string | null;
  onViewChange: (view: AuthView) => void;
  onClose: () => void;
}

const VIEW_COPY: Record<AuthView, { title: string; subtitle: string }> = {
  login: {
    title: "Welcome Back",
    subtitle: "Sign in to continue to PizzHub.",
  },
  signup: {
    title: "Create Account",
    subtitle: "Join PizzHub and start ordering in minutes.",
  },
  "forgot-password": {
    title: "Reset Password",
    subtitle: "Enter your email and we'll send you a reset link.",
  },
};

const CLOSE_ANIMATION_MS = 320;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function AuthenticationModal({
  isOpen,
  view,
  redirectTo,
  onViewChange,
  onClose,
}: AuthenticationModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Mount immediately on open; on close, keep rendering for the
  // duration of the exit animation before actually unmounting.
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      // Defer state updates to avoid synchronous setState inside effect
      // which can cause cascading renders. Using a short timeout yields
      // the same behavior without the React warning.
      const id = window.setTimeout(() => {
        setShouldRender(true);
        setIsClosing(false);
      }, 0);
      return () => window.clearTimeout(id);
      return;
    }

    if (shouldRender) {
      // Defer setting `isClosing` so we don't call setState synchronously
      // inside the effect body which can trigger cascading renders.
      const startId = window.setTimeout(() => {
        setIsClosing(true);
        const timeout = window.setTimeout(() => {
          setShouldRender(false);
          setIsClosing(false);
          previouslyFocusedElement.current?.focus?.();
        }, CLOSE_ANIMATION_MS);
        // clear the close timeout if the effect cleans up
        cleanup.closeTimeout = timeout;
      }, 0);

      const cleanup: (() => void) & { closeTimeout?: number } = () => {
        window.clearTimeout(startId);
        if (cleanup.closeTimeout) window.clearTimeout(cleanup.closeTimeout);
      };

      return cleanup;
    }
    // shouldRender intentionally omitted — only isOpen should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Lock body scroll while the modal is visible (open or closing).
  useEffect(() => {
    if (!shouldRender) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldRender]);

  // Focus the panel once it mounts, so keyboard users land inside it
  // immediately rather than having to Tab in from wherever they were.
  useEffect(() => {
    if (isOpen && shouldRender) {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        FOCUSABLE_SELECTOR
      );
      (firstFocusable ?? panelRef.current)?.focus();
    }
  }, [isOpen, shouldRender, view]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      // Basic focus trap: cycle Tab/Shift+Tab within the panel.
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (!shouldRender) return null;

  const { title, subtitle } = VIEW_COPY[view];

  return createPortal(
    <div
      className={`${styles.backdrop} ${isClosing ? styles.backdropClosing : ""}`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={`${styles.panel} ${isClosing ? styles.panelClosing : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <AuthHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
          onBack={
            view === "forgot-password" ? () => onViewChange("login") : undefined
          }
        />

        {/* Keyed on `view` so each switch mounts fresh, driving the
            crossfade + slight slide defined in the CSS module. Height
            adjusts via normal reflow rather than a JS-measured
            animation — a deliberate simplification, not an oversight. */}
        <div key={view} className={styles.viewTransition}>
          {view === "login" && (
<LoginForm
  onSwitchToSignup={() => onViewChange("signup")}
  onSwitchToForgotPassword={() => onViewChange("forgot-password")}
  onSuccess={onClose}
  redirectTo={redirectTo}
/>
          )}
          {view === "signup" && (
            <SignupForm onSwitchToLogin={() => onViewChange("login")} />
          )}
          {view === "forgot-password" && (
            <ForgotPasswordForm onSwitchToLogin={() => onViewChange("login")} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}