// src/components/admin/products/components/DeleteProductDialog.tsx
//
// Simple centered confirm modal, portaled to document.body for the same
// reason MobileDrawer is (so position:fixed can't get broken by some
// ancestor's transform).
//
// Focus management: opening the dialog moves focus to the Cancel
// button (the safe default action) and traps Tab/Shift+Tab inside the
// panel; closing it — by Escape, backdrop click, Cancel, or a
// successful delete — returns focus to whatever triggered it (the
// row's Delete button). Without this, keyboard and screen-reader users
// lose their place in the page every time the dialog opens or closes.

"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Pizza } from "@/lib/pizza";
import styles from "./DeleteProductDialog.module.css";

interface DeleteProductDialogProps {
  pizza: Pizza | null;
  deleting: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function DeleteProductDialog({
  pizza,
  deleting,
  error,
  onConfirm,
  onClose,
}: DeleteProductDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // On open: remember what had focus, then move focus into the dialog.
  useEffect(() => {
    if (!pizza) return;

    triggerElementRef.current = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();

    return () => {
      triggerElementRef.current?.focus?.();
    };
  }, [pizza]);

  useEffect(() => {
    if (!pizza) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) {
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
  }, [pizza, deleting, onClose]);

  if (!pizza) return null;

  return createPortal(
    <div className={styles.overlay} onClick={() => !deleting && onClose()}>
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-body"
        className={styles.panel}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-dialog-title" className={styles.title}>
          Delete {pizza.name}?
        </h2>

        <p id="delete-dialog-body" className={styles.body}>
          This permanently removes it from the menu and the database. This
          can&apos;t be undone.
        </p>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button
            ref={cancelButtonRef}
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete Pizza"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
