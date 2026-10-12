// src/components/profile/hooks/useAccountSettings.ts
//
// Same Bearer-token fetch pattern as useAddresses/useOrders — see
// those for why. Appearance (theme) deliberately has no hook here: it
// lives entirely in src/components/theme (localStorage, not the
// server), since it's a per-device display preference, not account
// data. Everything in this file IS account data, which is exactly
// what distinguishes Appearance from Marketing/Security/Danger Zone.

"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredAuthToken } from "@/components/auth";
import type { MarketingPreferencesDTO } from "@/lib/account";

function authHeaders(): HeadersInit {
  const token = getStoredAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface UseAccountSettingsResult {
  preferences: MarketingPreferencesDTO | null;
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
  updatePreferences: (
    input: Partial<MarketingPreferencesDTO>
  ) => Promise<{ error?: string }>;
  /** Returns the freshly issued token on success — changing your own
   * password bumps authVersion server-side, which invalidates this
   * very request's own token too (see lib/account.ts's
   * changeUserPassword), so the caller MUST store the returned token
   * in place of the old one (via AuthContext.refreshToken) or this
   * session will fail its next authenticated request. */
  changePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ error?: string; token?: string }>;
  deleteAccount: (currentPassword: string) => Promise<{ error?: string }>;
}

export function useAccountSettings(): UseAccountSettingsResult {
  const [preferences, setPreferences] = useState<MarketingPreferencesDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchPreferences() {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch("/api/account/preferences", {
          headers: authHeaders(),
        });
        if (cancelled) return;

        if (!response.ok) {
          setHasError(true);
          return;
        }

        const data = (await response.json()) as { preferences: MarketingPreferencesDTO };
        if (!cancelled) setPreferences(data.preferences);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchPreferences();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const updatePreferences = useCallback(
    async (input: Partial<MarketingPreferencesDTO>) => {
      try {
        const response = await fetch("/api/account/preferences", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(input),
        });

        const data = await response.json();
        if (!response.ok) {
          return { error: data.error ?? "Something went wrong." };
        }

        setPreferences(data.preferences as MarketingPreferencesDTO);
        return {};
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    },
    []
  );

  const changePassword = useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      try {
        const response = await fetch("/api/account/password", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(input),
        });

        const data = await response.json();
        if (!response.ok) {
          return { error: data.error ?? "Something went wrong." };
        }

        return { token: data.token as string };
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    },
    []
  );

  const deleteAccount = useCallback(async (currentPassword: string) => {
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error ?? "Something went wrong." };
      }

      return {};
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  }, []);

  return {
    preferences,
    isLoading,
    hasError,
    retry,
    updatePreferences,
    changePassword,
    deleteAccount,
  };
}
