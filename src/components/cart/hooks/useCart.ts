"use client";

/**
 * useCart.ts
 *
 * The ONLY sanctioned way to consume cart state anywhere in the app.
 * Mirrors useFavorites.ts exactly: throws a clear, actionable error if
 * used outside <CartProvider>, instead of silently returning undefined
 * and causing confusing downstream crashes.
 */

import { useContext } from "react";
import { CartContext, type CartContextValue } from "../context/CartContext";

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error(
      "useCart must be used within a <CartProvider>. " +
        "Make sure CartProvider wraps this component (typically in src/app/layout.tsx)."
    );
  }

  return context;
}