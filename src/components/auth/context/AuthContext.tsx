// src/components/auth/context/AuthContext.tsx
//
// Cross-tab logout sync: closing a session in one tab must be visible
// in every other open tab immediately, not just after a manual
// refresh — otherwise tab B can keep acting as a signed-in admin for
// its entire session lifetime after the admin explicitly signed out in
// tab A.
//
// Two mechanisms, layered:
//  1. BroadcastChannel — an explicit "logout" message every open tab
//     receives instantly, including the tab that isn't doing any
//     localStorage read/write itself.
//  2. `storage` event fallback — fires natively in *other* tabs
//     whenever localStorage changes (never in the tab that made the
//     change), so even browsers without BroadcastChannel support
//     (older Safari) still sync correctly.
// Both listeners funnel into the same local-only state clear
// (clearLocalSession) so neither path re-triggers the other or
// re-calls /api/auth/logout — only the tab the person actually clicked
// "Log out" in does that.

"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  /**
   * Replaces ONLY the stored token — not the user profile, and
   * doesn't touch `user` state or broadcast anything to other tabs.
   * For the one case where the server re-issues a token for the
   * SAME session without the person re-logging in: changing your own
   * password bumps authVersion (see lib/auth.ts), which invalidates
   * the very request that changed it along with every other session,
   * so the password-change endpoint hands back a new token and this
   * is how the client swaps it in without disturbing anything else.
   */
  refreshToken: (token: string) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

const TOKEN_KEY = "token";
const USER_KEY = "user";
const BROADCAST_CHANNEL_NAME = "pizzhub-auth";

/**
 * The one sanctioned way for code outside AuthContext to read the
 * current Bearer token (CartContext needs this to call /api/cart/*).
 * Exists so the "token" localStorage key stays defined in exactly one
 * place — every other file imports this instead of re-typing the
 * literal string, which is exactly the kind of thing that silently
 * drifts out of sync if it's ever duplicated.
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const token = window.localStorage.getItem(TOKEN_KEY);
      const storedUser = window.localStorage.getItem(USER_KEY);
      if (token && storedUser) return JSON.parse(storedUser) as AuthUser;
    } catch {
      // Ignore corrupt localStorage and stay logged out.
    }
    return null;
  });

  const [isHydrated] = useState(() => {
    if (typeof window === "undefined") return false;
    return true;
  });
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Clears this tab's *local* state only. Never calls the logout API
  // and never posts to the broadcast channel — this is the handler for
  // "another tab already did the real work, just catch up."
  const clearLocalSession = useCallback(() => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage errors.
    }
    setUser(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === "logout") {
          clearLocalSession();
        }
      };
      channelRef.current = channel;
    }

    // Fallback for browsers without BroadcastChannel: a `storage` event
    // fires in every OTHER tab (never the originating one) whenever
    // localStorage changes. Firing when USER_KEY is removed catches the
    // same logout event this app already performs via
    // localStorage.removeItem.
    function handleStorage(event: StorageEvent) {
      if (event.key === USER_KEY && event.newValue === null) {
        clearLocalSession();
      }
    }
    window.addEventListener("storage", handleStorage);

    return () => {
      channel?.close();
      channelRef.current = null;
      window.removeEventListener("storage", handleStorage);
    };
  }, [clearLocalSession]);

  const login = useCallback((nextUser: AuthUser, token: string) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } catch {
      // Ignore storage errors.
    }

    setUser(nextUser);
  }, []);

  const refreshToken = useCallback((token: string) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignore storage errors — worst case this tab keeps using its
      // now-stale token and gets a 401 on its next authenticated
      // request, same failure mode as any other storage write failing.
    }
  }, []);

  const logout = useCallback(() => {
    clearLocalSession();

    // Tell every other open tab right now, rather than waiting for
    // them to notice on their own next action.
    channelRef.current?.postMessage({ type: "logout" });

    // Fire-and-forget: destroys the HttpOnly admin_session cookie
    // server-side, if one was set. Doesn't block the UI from clearing
    // immediately — worst case on network failure, the (short-lived,
    // 8h) admin cookie outlives the client-visible logout, same as any
    // best-effort logout call.
    void fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, [clearLocalSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isHydrated,
      login,
      logout,
      refreshToken,
    }),
    [user, isHydrated, login, logout, refreshToken]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}