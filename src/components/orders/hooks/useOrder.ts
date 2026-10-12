// src/components/orders/hooks/useOrder.ts
//
// Fetches by explicit orderId (from the URL) rather than "whatever's
// most recent in localStorage" — that assumption broke the moment
// order data moved server-side.
//
// Polling addition for Paystack: a COD order is always "confirmed" by
// the time this hook's first fetch resolves, so polling was never
// needed before. An online-payment order can genuinely still be
// "pending" at that exact moment — the webhook that confirms it is an
// async, separate request from Paystack that may not have arrived yet
// when the browser redirects back. While status is "pending", this
// re-fetches every 2.5s, capped at 12 attempts (~30s) — bounded so an
// order that's genuinely stuck doesn't poll forever; the UI is
// responsible for telling the person what to do if it times out.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredAuthToken } from "@/components/auth";
import type { OrderDTO } from "@/lib/orders";

export type Order = OrderDTO;

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 12;

interface UseOrderResult {
  order: Order | null;
  isLoading: boolean;
  /** true only for a genuine failure (network, 500) — a 404/403 (not
   * found or not yours) is treated as "no order", not an error state,
   * since the caller's response to both is the same: redirect away. */
  notFound: boolean;
  /** True once polling has hit MAX_POLL_ATTEMPTS while still pending —
   * lets the UI switch from "hang tight" to "this is taking longer
   * than expected" messaging instead of polling silently forever. */
  pollTimedOut: boolean;
  /** Manually restarts the fetch (and, if still pending, a fresh
   * ~30s poll window) — the "Check again" action for the pollTimedOut
   * state. Bumping retryKey re-runs the whole effect, same as if
   * orderId had changed, which is exactly "start over" semantics. */
  retry: () => void;
}

export function useOrder(orderId: string | null): UseOrderResult {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(!orderId ? false : true);
  const [notFound, setNotFound] = useState(!orderId);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollAttemptsRef = useRef(0);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => {
    setRetryKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!orderId) {
      pollAttemptsRef.current = 0;
      return;
    }
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    pollAttemptsRef.current = 0;

    const token = getStoredAuthToken();

    async function fetchOnce() {
      if (cancelled) return;

      setIsLoading(true);
      setNotFound(false);
      setPollTimedOut(false);

      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (cancelled) return;

        if (!response.ok) {
          setNotFound(true);
          setOrder(null);
          return;
        }

        const data = (await response.json()) as Order;
        if (cancelled) return;
        setOrder(data);

        if (data.status === "pending") {
          pollAttemptsRef.current += 1;
          if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
            setPollTimedOut(true);
            return;
          }
          timeoutId = setTimeout(fetchOnce, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setOrder(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchOnce();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [orderId, retryKey]);

  return { order, isLoading, notFound, pollTimedOut, retry };
}