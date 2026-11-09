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
import { isTrustedAvatarUrl } from "@/lib/avatar-url";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  /**
   * Kept for API compatibility; does nothing. Sessions are now an
   * HttpOnly cookie the server manages, so there is no client-held token
   * to replace (a password change keeps this tab's session server-side).
   */
  refreshToken: (token: string) => void;
  /**
   * Merges a partial update (today: avatarUrl) into the logged-in
   * user, in state AND in the persisted copy, so a profile-picture
   * change shows up everywhere at once and survives a page refresh.
   * Does nothing when nobody is logged in. `id` cannot be patched.
   */
  updateUser: (patch: Partial<Omit<AuthUser, "id">>) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

const TOKEN_KEY = "token";
const USER_KEY = "user";
const BROADCAST_CHANNEL_NAME = "pizzhub-auth";

/**
 * Kept so existing callers keep compiling. Always null: the session
 * credential is an HttpOnly cookie that page scripts cannot read, and
 * same-origin fetch() sends it automatically. Callers that attach an
 * Authorization header only when this returns a value therefore send
 * none, and the server authenticates them by cookie.
 */
export function getStoredAuthToken(): string | null {
  return null;
}

/**
 * Drops a cached avatarUrl that isn't inside this environment's avatar
 * bucket. The user object is cached in localStorage across sessions, so
 * after SUPABASE_URL is switched (e.g. production -> dev) a signed-in
 * browser still holds the old project's picture URL, which next/image
 * would refuse to render. Only the in-memory copy is cleaned; the stored
 * copy is overwritten the next time the user logs in or changes their
 * picture. Everything else on the user is passed through untouched.
 */
function withRenderableAvatar(user: AuthUser): AuthUser {
  if (user.avatarUrl === undefined || isTrustedAvatarUrl(user.avatarUrl)) {
    return user;
  }
  const cleaned = { ...user };
  delete cleaned.avatarUrl;
  return cleaned;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const storedUser = window.localStorage.getItem(USER_KEY);
      if (storedUser) {
        return withRenderableAvatar(JSON.parse(storedUser) as AuthUser);
      }
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

  // The cached profile above is only a convenience copy. Ask the server
  // whether a live session really exists: if it was revoked (logout on
  // another device, password change, expiry, deleted account) this signs
  // the tab out; if it is valid, the profile is refreshed from the
  // database (role, name, avatar). A network error changes nothing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Remove any pre-cookie bearer token left by an older version.
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore storage errors.
    }

    // Guests have nothing to confirm; skip the request for them.
    try {
      if (!window.localStorage.getItem(USER_KEY)) return;
    } catch {
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401) {
          clearLocalSession();
          return;
        }
        if (!response.ok) return;
        const data = (await response.json()) as { user?: AuthUser };
        if (!data.user) return;
        const fresh = withRenderableAvatar({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          avatarUrl: data.user.avatarUrl,
        });
        try {
          window.localStorage.setItem(USER_KEY, JSON.stringify(fresh));
        } catch {
          // Ignore storage errors.
        }
        setUser(fresh);
      } catch {
        // Offline or aborted: keep whatever we have.
      }
    })();
    return () => controller.abort();
  }, [clearLocalSession]);

  // The `token` argument is accepted for API compatibility and ignored:
  // the server set an HttpOnly session cookie on the login response.
  const login = useCallback((nextUser: AuthUser) => {
    const safeUser = withRenderableAvatar(nextUser);

    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    } catch {
      // Ignore storage errors.
    }

    setUser(safeUser);
  }, []);

  // No-op, see the interface comment.
  const refreshToken = useCallback(() => {}, []);

  const updateUser = useCallback(
    (patch: Partial<Omit<AuthUser, "id">>) => {
      if (!user) return;
      const nextUser: AuthUser = { ...user, ...patch };
      try {
        window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      } catch {
        // Storage unavailable (private mode / quota): the in-memory
        // update below still applies for this session.
      }
      setUser(nextUser);
    },
    [user]
  );

  const logout = useCallback(() => {
    clearLocalSession();

    // Tell every other open tab right now, rather than waiting for
    // them to notice on their own next action.
    channelRef.current?.postMessage({ type: "logout" });

    // Fire-and-forget: the server deletes the session row (so the cookie
    // stops working everywhere) and expires the cookie. Doesn't block the
    // UI. keepalive lets the request finish if the page navigates away.
    void fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => {});
  }, [clearLocalSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isHydrated,
      login,
      logout,
      refreshToken,
      updateUser,
    }),
    [user, isHydrated, login, logout, refreshToken, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}