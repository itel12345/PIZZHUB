"use client";

import { useAuth } from "@/components/auth/context";

import type { AuthUser } from "@/components/auth/types/auth";
// Re-exported, not just imported — NavActions/index.ts barrel-exports
// AuthUser from this file, which requires this file to actually export
// it, not just use it internally. This was the missing piece.
export type { AuthUser };

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export function useAuthState(): AuthState {
  const { user, isAuthenticated } = useAuth();

  return {
    isAuthenticated,
    user,
  };
}