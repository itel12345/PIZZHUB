// src/components/layout/NavActions/useAuthState.ts
// TEMPORARY mock. Returns a hardcoded "logged out" state so the Navbar can
// be built against a real shape before Auth.js is wired up.
//
// Future integration: replace the body of this hook with Auth.js's
// `useSession()` (client) or a server-side session read, and map its
// result to this same { isAuthenticated, user } shape. Every component
// that calls useAuthState() — NavActions, MobileNavActions — will then
// start reflecting real auth state with zero changes on their end.

"use client";

export interface AuthUser {
  name: string;
  avatarUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export function useAuthState(): AuthState {
  // TODO: swap for real Auth.js session once configured.
  return {
    isAuthenticated: false,
    user: null,
  };
}