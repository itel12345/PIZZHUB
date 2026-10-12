// src/components/cart/toast/CartToastContext.tsx
//
// Deliberately its own small context, not folded into CartContext —
// CartContext owns cart *data*; this owns a transient UI notification
// that happens to be triggered by cart actions. Keeping them separate
// means CartContext's actual architecture (the thing explicitly not
// to be touched) stays untouched in shape — this only reads its
// addToCart's return value from the outside, it doesn't reach in.
//
// Single-toast, not a stacking queue: a new toast replaces whatever's
// showing and resets the dismiss timer. A pizza site's add-to-cart
// confirmation doesn't need a notification center — if someone clicks
// Add on three pizzas in three seconds, seeing the latest one clearly
// is more useful than three overlapping banners.

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import CartToast from "./CartToast";

export type CartToastKind = "added" | "quantity-updated";

export interface CartToastState {
  id: number;
  kind: CartToastKind;
  pizzaName: string;
}

interface CartToastContextValue {
  showAddedToast: (pizzaName: string) => void;
  showQuantityUpdatedToast: (pizzaName: string) => void;
}

const CartToastContext = createContext<CartToastContextValue | undefined>(
  undefined
);

const DISMISS_AFTER_MS = 2600;

export function CartToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<CartToastState | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdRef = useRef(0);

  const show = useCallback((kind: CartToastKind, pizzaName: string) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

    nextIdRef.current += 1;
    setToast({ id: nextIdRef.current, kind, pizzaName });

    dismissTimerRef.current = setTimeout(() => {
      setToast(null);
    }, DISMISS_AFTER_MS);
  }, []);

  const showAddedToast = useCallback(
    (pizzaName: string) => show("added", pizzaName),
    [show]
  );

  const showQuantityUpdatedToast = useCallback(
    (pizzaName: string) => show("quantity-updated", pizzaName),
    [show]
  );

  const dismiss = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setToast(null);
  }, []);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  return (
    <CartToastContext.Provider value={{ showAddedToast, showQuantityUpdatedToast }}>
      {children}
      <CartToast toast={toast} onDismiss={dismiss} />
    </CartToastContext.Provider>
  );
}

export function useCartToast(): CartToastContextValue {
  const context = useContext(CartToastContext);
  if (!context) {
    throw new Error("useCartToast must be used within a CartToastProvider.");
  }
  return context;
}