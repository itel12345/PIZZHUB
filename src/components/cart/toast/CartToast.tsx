// src/components/cart/toast/CartToast.tsx
//
// Pure presentation — CartToastContext owns when/what to show, this
// just renders it. Portaled to document.body for the same reason
// DeleteProductDialog is: position:fixed shouldn't be at the mercy of
// some ancestor's transform/overflow further up the tree.

"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { useHasMounted } from "@/hooks/useHasMounted";
import type { CartToastState } from "./CartToastContext";
import styles from "./CartToast.module.css";

interface CartToastProps {
  toast: CartToastState | null;
  onDismiss: () => void;
}

export default function CartToast({ toast, onDismiss }: CartToastProps) {
  // Portal needs a real document.body, which doesn't exist during SSR
  // — same guard every portal-based component in this app already
  // uses (DeleteProductDialog, MobileDrawer), now via the shared
  // useHasMounted hook instead of a local useState+useEffect pair
  // (that pair is what eslint-plugin-react-hooks' newer
  // set-state-in-effect rule flags — useSyncExternalStore, which
  // useHasMounted wraps, is the purpose-built alternative for exactly
  // this "sync with SSR-vs-client reality" case).
  const mounted = useHasMounted();

  if (!mounted) return null;

  return createPortal(
    // aria-live="polite" (not "assertive"): this is a nice-to-know
    // confirmation, not an error or something demanding immediate
    // interruption — polite announces it without cutting off whatever
    // a screen reader was already saying.
    <div className={styles.viewport} aria-live="polite" aria-atomic="true">
      {toast && (
        <div key={toast.id} className={styles.toast} role="status">
          <span className={styles.checkmark} aria-hidden="true">
            ✓
          </span>
          <span className={styles.message}>
            {toast.kind === "added" ? (
              <>
                <strong>{toast.pizzaName}</strong> added to your cart
              </>
            ) : (
              <>
                <strong>{toast.pizzaName}</strong> quantity updated
              </>
            )}
          </span>
          <Link href="/cart" className={styles.viewCart} onClick={onDismiss}>
            View cart
          </Link>
        </div>
      )}
    </div>,
    document.body
  );
}