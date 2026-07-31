"use client";

import { useAuth } from "@/components/auth/context";

import type { AuthUser } from "@/components/auth/types/auth";

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