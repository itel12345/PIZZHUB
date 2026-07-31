// src/components/auth/context/AuthContext.tsx

"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "../types/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

const TOKEN_KEY = "token";
const USER_KEY = "user";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read the stored session once after the app mounts.
  useEffect(() => {
    try {
      const token = window.localStorage.getItem(TOKEN_KEY);
      const storedUser = window.localStorage.getItem(USER_KEY);

      if (token && storedUser) {
        setUser(JSON.parse(storedUser) as AuthUser);
      }
    } catch {
      // Ignore corrupt localStorage and stay logged out.
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const login = useCallback((nextUser: AuthUser, token: string) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } catch {
      // Ignore storage errors.
    }

    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage errors.
    }

    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isHydrated,
      login,
      logout,
    }),
    [user, isHydrated, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}