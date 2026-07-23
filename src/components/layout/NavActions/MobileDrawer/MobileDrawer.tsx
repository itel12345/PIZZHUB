"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./MobileDrawer.module.css";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * MobileDrawer
 *
 * Left-side drawer shell replacing the old dropdown mobile panel. Owns:
 * - the dark blurred overlay (click to close)
 * - the sliding glass panel (transform/opacity only — no width/left
 *   animation, per the performance requirement)
 * - body scroll lock while open
 * - ESC-to-close
 * - a basic focus trap (Tab cycles within the panel while open)
 * - `inert` on the panel while closed, so its off-screen content can't be
 *   focused or read by screen readers until it's actually open
 *
 * Rendered via a React Portal directly into document.body. This matters:
 * `position: fixed` is only positioned relative to the true viewport if
 * NO ancestor element has a transform/filter/perspective/will-change set.
 * Different pages (homepage's Hero/Story Experience vs. Menu vs. Pizza
 * Details) wrap content differently, and if any ancestor anywhere between
 * this component and <body> ever has one of those properties, "fixed"
 * silently becomes relative to that ancestor instead — which is exactly
 * why this looked solid on some pages and see-through/broken on others.
 * Portaling straight into document.body sidesteps every page's ancestor
 * markup entirely, guaranteeing identical behavior everywhere.
 *
 * Content (nav links, auth section) is passed in as children — this
 * component only owns the drawer mechanics, not what's inside it.
 */
export default function MobileDrawer({ isOpen, onClose, children }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Portals need a real `document` to target, which doesn't exist during
  // server rendering — only render the portal after mounting on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock page scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Focus the close button on open, ESC closes, Tab is trapped inside the panel.
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        inert={!isOpen}
      >
        <div className={styles.header}>
          <span className={styles.logo}>
            Pizz<span className={styles.logoAccent}>Hub</span>
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.content}>{children}</div>
      </div>
    </>,
    document.body
  );
}