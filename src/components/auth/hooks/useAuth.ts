// src/components/auth/hooks/useAuth.ts
//
// The sanctioned way to consume auth state anywhere in the app —
// mirrors useCart()/useFavorites()'s "throw a clear error outside the
// provider" convention. This is what replaces every useAuthState()
// call across the codebase.

"use client";

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "../context/AuthContext";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an <AuthProvider>. " +
        "Make sure AuthProvider wraps this component (typically in src/app/layout.tsx)."
    );
  }

  return context;
}