// src/components/addresses/hooks/useAddresses.ts
//
// Same Bearer-token fetch pattern as useOrders/useOrder — customer
// auth is a localStorage JWT, not a cookie, so every request attaches
// it explicitly. Optimistic local state updates after each mutation
// (add/update/delete/setDefault) rather than a full refetch, so the
// list feels instant; each mutation still round-trips to the server
// first and only updates local state on a real success response.

"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredAuthToken } from "@/components/auth";
import type { AddressInput, AddressUpdateInput } from "@/lib/validation/address";
import type { AddressDTO } from "@/lib/addresses";

export type Address = AddressDTO;

function authHeaders(): HeadersInit {
  const token = getStoredAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface UseAddressesResult {
  addresses: Address[];
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
  /** Returns the created address on success, or a user-facing error
   * message on failure — callers decide how to surface it (inline
   * form error, toast, etc.) rather than this hook owning that UI. */
  addAddress: (input: AddressInput) => Promise<{ error?: string }>;
  updateAddress: (id: string, input: AddressUpdateInput) => Promise<{ error?: string }>;
  deleteAddress: (id: string) => Promise<{ error?: string }>;
  setDefaultAddress: (id: string) => Promise<{ error?: string }>;
}

export function useAddresses(): UseAddressesResult {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAddresses() {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch("/api/addresses", { headers: authHeaders() });
        if (cancelled) return;

        if (!response.ok) {
          setHasError(true);
          setAddresses([]);
          return;
        }

        const data = (await response.json()) as { addresses: Address[] };
        if (!cancelled) setAddresses(data.addresses);
      } catch {
        if (!cancelled) {
          setHasError(true);
          setAddresses([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchAddresses();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  // Re-sorts the same way the server does (default first, then most
  // recently updated) so a set-default/add doesn't leave the list in
  // a visibly wrong order until the next full refetch.
  const applySorted = useCallback((next: Address[]) => {
    setAddresses(
      [...next].sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      })
    );
  }, []);

  const addAddress = useCallback(
    async (input: AddressInput) => {
      try {
        const response = await fetch("/api/addresses", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(input),
        });

        const data = await response.json();
        if (!response.ok) {
          return { error: data.error ?? "Something went wrong." };
        }

        const created = data.address as Address;
        applySorted([
          ...addresses.map((existing) =>
            created.isDefault ? { ...existing, isDefault: false } : existing
          ),
          created,
        ]);
        return {};
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    },
    [addresses, applySorted]
  );

  const updateAddress = useCallback(
    async (id: string, input: AddressUpdateInput) => {
      try {
        const response = await fetch(`/api/addresses/${id}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(input),
        });

        const data = await response.json();
        if (!response.ok) {
          return { error: data.error ?? "Something went wrong." };
        }

        const updated = data.address as Address;
        applySorted(
          addresses.map((existing) => {
            if (existing.id === updated.id) return updated;
            return updated.isDefault ? { ...existing, isDefault: false } : existing;
          })
        );
        return {};
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    },
    [addresses, applySorted]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/addresses/${id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });

        const data = await response.json();
        if (!response.ok) {
          return { error: data.error ?? "Something went wrong." };
        }

        // The server may have auto-promoted a new default (see
        // deleteAddressForUser) — simplest correct way to reflect that
        // without guessing which one it picked is a quick refetch,
        // rather than duplicating that promotion logic client-side.
        retry();
        return {};
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    },
    [retry]
  );

  const setDefaultAddress = useCallback(
    (id: string) => updateAddress(id, { isDefault: true }),
    [updateAddress]
  );

  return {
    addresses,
    isLoading,
    hasError,
    retry,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}