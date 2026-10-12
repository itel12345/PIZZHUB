"use client";

/**
 * CartContext.tsx
 *
 * Dual-backed: guest sessions read/write localStorage exactly as
 * before (via cartStorage.ts, unchanged); authenticated sessions read/
 * write the server cart through /api/cart/*. Every downstream consumer
 * (CartButton, CartPage, CartSummary, CartItem) calls the exact same
 * public interface this always exposed — items, itemCount, subtotal,
 * addToCart, removeFromCart, increaseQuantity, decreaseQuantity,
 * clearCart — none of them needed to change for this rewrite.
 *
 * Two additions to the public interface that ARE new, and deliberate:
 * `isLoading` and `error`. The original localStorage-only version was
 * fully synchronous and never needed either. Network calls can be slow
 * or fail; hiding that from the UI isn't "keeping the interface
 * stable", it's lying about what's actually happening. Both are
 * additive — no existing field changed shape or meaning.
 *
 * Server responses are the new truth, not optimistic local mutations.
 * Every server-mode action calls the API, then replaces `items` with
 * whatever the response says — see the architecture writeup for why
 * (this data feeds checkout/payment soon; correctness over perceived
 * speed).
 *
 * Merge-on-login: watches the `isAuthenticated` transition from false
 * to true (via a ref, not a dependency-triggered effect — this must
 * fire exactly once per actual login, not on every re-render where
 * isAuthenticated happens to be true). On that transition, POSTs
 * whatever's currently in the guest cart to /api/cart/merge, then
 * clears localStorage on success and switches to server-backed state.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth, getStoredAuthToken } from "@/components/auth";
import {
  clear as clearGuestStorage,
  getCartItemKey,
  load as loadGuestStorage,
  save as saveGuestStorage,
  type CartItem,
} from "../storage/cartStorage";

export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  error: string | null;
  // Returns whether the add actually succeeded — necessary for the
  // add-to-cart confirmation toast (PizzaCard/PizzaActions) to only
  // fire on a real success, not optimistically at click time. This is
  // an additive signature change (void -> Promise<boolean>): existing
  // callers that don't await/use the return value are unaffected,
  // guest mode still resolves synchronously in practice (it can't
  // fail), only server mode's resolution now actually waits on the
  // fetch instead of being fire-and-forget.
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => Promise<boolean>;
  removeFromCart: (pizzaId: string) => void;
  increaseQuantity: (pizzaId: string) => void;
  decreaseQuantity: (pizzaId: string) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(
  undefined
);

interface CartProviderProps {
  children: ReactNode;
}

interface ServerCartItemDTO {
  id: string;
  pizzaId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface ServerCartSummaryDTO {
  items: ServerCartItemDTO[];
  itemCount: number;
  subtotal: number;
}

/** Server CartItem.id (cuid) differs from the client-facing CartItem
 * shape, which keys everything off pizzaId (a string, matching the
 * guest-cart shape). This map is the bridge — kept in a ref, not
 * state, since it's bookkeeping the UI never renders directly. */
type ServerIdMap = Map<string, string>; // pizzaId -> CartItem.id

function serverDtoToClientItems(dto: ServerCartSummaryDTO): {
  items: CartItem[];
  idMap: ServerIdMap;
} {
  const idMap: ServerIdMap = new Map();
  const items: CartItem[] = dto.items.map((item) => {
    idMap.set(String(item.pizzaId), item.id);
    return {
      pizzaId: String(item.pizzaId),
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    };
  });
  return { items, idMap };
}

export function CartProvider({ children }: CartProviderProps) {
  const { isAuthenticated, isHydrated } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasHydratedGuestCart = useRef(false);
  const wasAuthenticated = useRef(false);
  const serverIdMap = useRef<ServerIdMap>(new Map());

  const authHeader = useCallback((): HeadersInit => {
    const token = getStoredAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const applyServerSummary = useCallback((dto: ServerCartSummaryDTO) => {
    const { items: nextItems, idMap } = serverDtoToClientItems(dto);
    serverIdMap.current = idMap;
    setItems(nextItems);
  }, []);

  const fetchServerCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cart", { headers: authHeader() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load cart.");
      applyServerSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cart.");
    } finally {
      setIsLoading(false);
    }
  }, [authHeader, applyServerSummary]);

  // Guest-mode hydration: unchanged from the original implementation.
  useEffect(() => {
    if (isAuthenticated) return;
    // Defer setting state to avoid synchronous setState during render/effect
    // which can cause cascading renders. Use a microtask so the update
    // happens after the current effect completes.
    Promise.resolve().then(() => {
      setItems(loadGuestStorage());
      hasHydratedGuestCart.current = true;
    });
  }, [isAuthenticated]);

  // Guest-mode persistence: unchanged from the original implementation.
  useEffect(() => {
    if (isAuthenticated) return;
    if (!hasHydratedGuestCart.current) return;
    saveGuestStorage(items);
  }, [items, isAuthenticated]);

  // The merge-on-login + auth-transition handling. Runs after
  // AuthContext has hydrated (so isAuthenticated reflects reality, not
  // the SSR-safe false default).
  useEffect(() => {
    if (!isHydrated) return;

    const justLoggedIn = isAuthenticated && !wasAuthenticated.current;
    const justLoggedOut = !isAuthenticated && wasAuthenticated.current;
    wasAuthenticated.current = isAuthenticated;

    if (justLoggedIn) {
      const guestItems = loadGuestStorage();

      if (guestItems.length === 0) {
        // Defer calling fetchServerCart to avoid synchronously triggering
        // setState inside this effect which can cause cascading renders.
        void Promise.resolve().then(fetchServerCart);
        return;
      }

      // Defer the merge request and related state updates to avoid
      // synchronous setState inside the effect body.
      void Promise.resolve().then(() => {
        setIsLoading(true);
        setError(null);

        void fetch("/api/cart/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({
            items: guestItems.map((item) => ({
              pizzaId: Number(item.pizzaId),
              quantity: item.quantity,
            })),
          }),
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to merge cart.");
            // Only clear the guest cart once the server has confirmed
            // the merge succeeded — clearing first and merging second
            // would lose items on a failed request.
            clearGuestStorage();
            applyServerSummary(data);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to merge cart.");
          })
          .finally(() => setIsLoading(false));
      });

      return;
    }

    if (justLoggedOut) {
      // Don't carry a signed-out view of someone's server cart forward,
      // and don't resurrect whatever guest cart existed before they'd
      // logged in — start clean, same as a first-time visitor.
      serverIdMap.current = new Map();
      setItems([]);
      setError(null);
      return;
    }

    if (isAuthenticated) {
      // Defer server fetch until after this effect completes to avoid
      // synchronously triggering state updates during render.
      void Promise.resolve().then(fetchServerCart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isHydrated]);

  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity">, quantity: number = 1): Promise<boolean> => {
      if (!isAuthenticated) {
        setItems((prev) => {
          const key = getCartItemKey(item);
          const existingIndex = prev.findIndex(
            (existing) => getCartItemKey(existing) === key
          );

          if (existingIndex !== -1) {
            const next = [...prev];
            next[existingIndex] = {
              ...next[existingIndex],
              quantity: next[existingIndex].quantity + quantity,
            };
            return next;
          }

          return [...prev, { ...item, quantity: Math.max(1, quantity) }];
        });
        return Promise.resolve(true);
      }

      // Optimistic: the item appears in the cart immediately, before
      // the server has confirmed anything. Safe to do because nothing
      // downstream trusts this client-side state for money — checkout
      // always re-derives the cart fresh from the database at order
      // creation (see createCodOrder/createOnlinePendingOrder). This
      // display updating a moment before the server agrees carries no
      // real risk, only a rollback-on-failure UX cost.
      const previousItems = items;
      setItems((prev) => {
        const key = getCartItemKey(item);
        const existingIndex = prev.findIndex((existing) => getCartItemKey(existing) === key);
        if (existingIndex !== -1) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + quantity,
          };
          return next;
        }
        return [...prev, { ...item, quantity: Math.max(1, quantity) }];
      });
      setError(null);

      return fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ pizzaId: Number(item.pizzaId), quantity }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Failed to add item.");
          // Reconciles with the authoritative state (also populates
          // serverIdMap with this item's real CartItem.id, needed
          // before it can be removed/adjusted).
          applyServerSummary(data);
          return true;
        })
        .catch((err) => {
          setItems(previousItems);
          setError(err instanceof Error ? err.message : "Failed to add item.");
          return false;
        });
    },
    [isAuthenticated, items, authHeader, applyServerSummary]
  );

  const removeFromCart = useCallback(
    (pizzaId: string) => {
      if (!isAuthenticated) {
        setItems((prev) => prev.filter((item) => getCartItemKey(item) !== pizzaId));
        return;
      }

      const cartItemId = serverIdMap.current.get(pizzaId);
      if (!cartItemId) return;

      const previousItems = items;
      setItems((prev) => prev.filter((item) => item.pizzaId !== pizzaId));
      setError(null);

      void fetch(`/api/cart/items/${cartItemId}`, {
        method: "DELETE",
        headers: authHeader(),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Failed to remove item.");
          applyServerSummary(data);
        })
        .catch((err) => {
          setItems(previousItems);
          setError(err instanceof Error ? err.message : "Failed to remove item.");
        });
    },
    [isAuthenticated, items, authHeader, applyServerSummary]
  );

  const setServerQuantity = useCallback(
    (pizzaId: string, nextQuantity: number, previousItems: CartItem[]) => {
      const cartItemId = serverIdMap.current.get(pizzaId);
      if (!cartItemId) return;

      setError(null);

      void fetch(`/api/cart/items/${cartItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ quantity: nextQuantity }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Failed to update quantity.");
          applyServerSummary(data);
        })
        .catch((err) => {
          // Roll back to exactly what was on screen before THIS
          // specific click — not just "refetch everything" — so a
          // failed increase doesn't clobber some other optimistic
          // change that may have landed successfully in the meantime.
          setItems(previousItems);
          setError(err instanceof Error ? err.message : "Failed to update quantity.");
        });
    },
    [authHeader, applyServerSummary]
  );

  const increaseQuantity = useCallback(
    (pizzaId: string) => {
      if (!isAuthenticated) {
        setItems((prev) =>
          prev.map((item) =>
            getCartItemKey(item) === pizzaId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
        return;
      }

      // Computed inside the functional updater, not from the outer
      // `items` closure — two rapid clicks before a re-render would
      // otherwise both read the SAME stale quantity and both compute
      // the same "+1" result, silently dropping one of the clicks
      // instead of actually incrementing twice. The updater function
      // itself still runs synchronously when setItems is called (React
      // computes the new state immediately, even though painting it is
      // deferred), so capturing nextQuantity/previousItems here is
      // safe to read right after, not a race.
      let nextQuantity: number | null = null;
      let previousItems: CartItem[] = items;

      setItems((prev) => {
        previousItems = prev;
        return prev.map((item) => {
          if (item.pizzaId !== pizzaId) return item;
          nextQuantity = item.quantity + 1;
          return { ...item, quantity: nextQuantity };
        });
      });

      if (nextQuantity === null) return; // pizzaId wasn't actually in the cart
      setServerQuantity(pizzaId, nextQuantity, previousItems);
    },
    [isAuthenticated, items, setServerQuantity]
  );

  const decreaseQuantity = useCallback(
    (pizzaId: string) => {
      if (!isAuthenticated) {
        setItems((prev) =>
          prev.map((item) =>
            getCartItemKey(item) === pizzaId
              ? { ...item, quantity: Math.max(1, item.quantity - 1) }
              : item
          )
        );
        return;
      }

      let nextQuantity: number | null = null;
      let previousItems: CartItem[] = items;

      setItems((prev) => {
        previousItems = prev;
        return prev.map((item) => {
          if (item.pizzaId !== pizzaId) return item;
          // Quantity floors at 1 here, same as guest mode — going to
          // 0 is what the Remove button is for, not decreasing past 1.
          nextQuantity = Math.max(1, item.quantity - 1);
          return { ...item, quantity: nextQuantity };
        });
      });

      if (nextQuantity === null) return;
      setServerQuantity(pizzaId, nextQuantity, previousItems);
    },
    [isAuthenticated, items, setServerQuantity]
  );

  const clearCart = useCallback(() => {
    if (!isAuthenticated) {
      setItems([]);
      clearGuestStorage();
      return;
    }

    setIsLoading(true);
    setError(null);
    void fetch("/api/cart", { method: "DELETE", headers: authHeader() })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to clear cart.");
        serverIdMap.current = new Map();
        setItems([]);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to clear cart.");
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, authHeader]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      isLoading,
      error,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      isLoading,
      error,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}