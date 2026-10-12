// src/components/orders/hooks/useOrders.ts
//
// List counterpart to useOrder.ts — same Bearer-token fetch pattern,
// but no polling (a list of historical orders has no "wait for the
// webhook" moment the way a single freshly-placed order does).

"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredAuthToken } from "@/components/auth";
import type { Order } from "./useOrder";

const PAGE_SIZE = 10;

interface UseOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  /** True only for a genuine fetch failure — distinct from "zero
   * orders", which is a normal, valid empty state, not an error. */
  hasError: boolean;
  goToPage: (page: number) => void;
  retry: () => void;
}

export function useOrders(): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);

  const goToPage = useCallback((nextPage: number) => {
    setPage(nextPage < 1 ? 1 : nextPage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = getStoredAuthToken();

    async function fetchOrders() {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(`/api/orders?page=${page}&pageSize=${PAGE_SIZE}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (cancelled) return;

        if (!response.ok) {
          setHasError(true);
          setOrders([]);
          setTotal(0);
          return;
        }

        const data = (await response.json()) as { orders: Order[]; total: number };
        if (cancelled) return;

        setOrders(data.orders);
        setTotal(data.total);
      } catch {
        if (!cancelled) {
          setHasError(true);
          setOrders([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [page, retryKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { orders, total, page, totalPages, isLoading, hasError, goToPage, retry };
}