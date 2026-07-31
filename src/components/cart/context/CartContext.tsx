"use client";

/**
 * CartContext.tsx
 *
 * Global cart state, following the exact same pattern as FavoritesContext:
 * - Starts empty on SSR / first render (hydration-safe).
 * - Loads from storage in an effect after mount.
 * - Persists on every change AFTER that initial load (so we never
 *   overwrite real saved data with the empty initial state).
 * - Derived values (itemCount, subtotal) are memoized, never stored as
 *   separate state, so they can never drift out of sync with `items`.
 *
 * This context is the ONLY thing UI components talk to. No component
 * should ever import cartStorage directly.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clear as clearStorage,
  getCartItemKey,
  load as loadStorage,
  save as saveStorage,
  type CartItem,
} from "../storage/cartStorage";

export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (pizzaId: string) => void;
  increaseQuantity: (pizzaId: string) => void;
  decreaseQuantity: (pizzaId: string) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(
  undefined
);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const hasHydrated = useRef(false);

  // Load from storage once, after mount (client-only).
  useEffect(() => {
    setItems(loadStorage());
    hasHydrated.current = true;
  }, []);

  // Persist on every change, but only once we've hydrated — otherwise
  // the initial empty state would immediately overwrite saved data.
  useEffect(() => {
    if (!hasHydrated.current) return;
    saveStorage(items);
  }, [items]);

  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
      setItems((prev) => {
        const key = getCartItemKey(item);
        const existingIndex = prev.findIndex(
          (existing) => getCartItemKey(existing) === key
        );

        if (existingIndex !== -1) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + quantity,
          };
          return next;
        }

        return [...prev, { ...item, quantity: Math.max(1, quantity) }];
      });
    },
    []
  );

  const removeFromCart = useCallback((pizzaId: string) => {
    setItems((prev) =>
      prev.filter((item) => getCartItemKey(item) !== pizzaId)
    );
  }, []);

  const increaseQuantity = useCallback((pizzaId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        getCartItemKey(item) === pizzaId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, []);

  const decreaseQuantity = useCallback((pizzaId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        getCartItemKey(item) === pizzaId
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    clearStorage();
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}