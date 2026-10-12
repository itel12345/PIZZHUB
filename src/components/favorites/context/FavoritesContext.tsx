"use client";

/**
 * FavoritesContext.tsx
 *
 * Dual-backed, same shape as CartContext's rewrite: guest sessions
 * read/write favoritesStorage.ts (localStorage) unchanged; authenticated
 * sessions read/write the server via /api/favorites/*. Every downstream
 * consumer (FavoriteButton via useFavorites, Navbar's badge,
 * FavoritesPage) calls the exact same public interface this always
 * exposed — favorites, favoriteCount, addFavorite, removeFavorite,
 * toggleFavorite, isFavorite, clearFavorites — none of them needed to
 * change.
 *
 * Simpler than Cart's rewrite in one real way: no quantity, no
 * subtotal, no per-item server id to track — a favorite IS its
 * pizzaId, so there's no server-id-to-client-id mapping layer the way
 * CartContext needs (serverIdMap). Merge-on-login logic is also
 * simpler for the same reason — see mergeGuestFavorites' docblock in
 * lib/favorites.ts for why it's safe to call more than once, unlike
 * the cart merge.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth, getStoredAuthToken } from "@/components/auth";
import { favoritesStorage } from "../storage/favoritesStorage";

export interface FavoritesContextValue {
  favorites: string[];
  favoriteCount: number;
  addFavorite: (pizzaId: string) => void;
  removeFavorite: (pizzaId: string) => void;
  toggleFavorite: (pizzaId: string) => void;
  isFavorite: (pizzaId: string) => boolean;
  clearFavorites: () => void;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);

interface FavoritesProviderProps {
  children: React.ReactNode;
}

interface FavoritesResponse {
  favorites: string[];
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { isAuthenticated, isHydrated } = useAuth();

  // Initialize from storage for guest sessions to avoid calling setState
  // synchronously inside an effect. If the user is authenticated at mount
  // we start with an empty list; wasAuthenticated is seeded to the
  // current auth state so we don't treat the initial mount as a login.
  const [favorites, setFavorites] = useState<string[]>(() =>
    isAuthenticated ? [] : favoritesStorage.load()
  );
  const wasAuthenticated = useRef(isAuthenticated);

  const authHeader = useCallback((): HeadersInit => {
    const token = getStoredAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Guest-mode hydration handled at initialization to avoid synchronous
  // setState inside an effect.

  // Guest-mode persistence — unchanged from the original implementation.
  useEffect(() => {
    if (isAuthenticated) return;
    favoritesStorage.save(favorites);
  }, [favorites, isAuthenticated]);

  const fetchServerFavorites = useCallback(async () => {
    try {
      const response = await fetch("/api/favorites", { headers: authHeader() });
      if (!response.ok) return;
      const data = (await response.json()) as FavoritesResponse;
      setFavorites(data.favorites);
    } catch {
      // Non-fatal — favorites failing to load isn't worth surfacing as
      // a blocking error the way an empty cart on checkout would be;
      // the heart icons just won't show as filled until a retry.
    }
  }, [authHeader]);

  // Merge-on-login, same auth-transition-via-ref pattern as
  // CartContext, minus the "don't call twice" caveat Cart's merge has
  // — mergeGuestFavorites is genuinely idempotent, so there's no
  // equivalent race to guard against here.
  useEffect(() => {
    if (!isHydrated) return;

    const justLoggedIn = isAuthenticated && !wasAuthenticated.current;
    const justLoggedOut = !isAuthenticated && wasAuthenticated.current;
    wasAuthenticated.current = isAuthenticated;

    if (justLoggedIn) {
      const guestFavorites = favoritesStorage.load();

      if (guestFavorites.length === 0) {
        (async () => {
          await fetchServerFavorites();
        })();
        return;
      }

      void fetch("/api/favorites/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          pizzaIds: guestFavorites.map((id) => Number(id)),
        }),
      })
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as FavoritesResponse;
          favoritesStorage.clear();
          setFavorites(data.favorites);
        })
        .catch(() => {
          // Merge failing isn't worth blocking on — worst case, guest
          // favorites stay in localStorage and simply don't merge this
          // session; nothing is lost, and it isn't user-facing-error
          // material the way a failed cart merge would be.
        });

      return;
    }

    if (justLoggedOut) {
      setFavorites([]);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isHydrated]);

  // Fetch server favorites when authenticated (after initial setup)
  useEffect(() => {
    if (isAuthenticated && isHydrated) {
      (async () => {
        await fetchServerFavorites();
      })();
    }
  }, [isAuthenticated, isHydrated, fetchServerFavorites]);

  const addFavorite = useCallback(
    (pizzaId: string) => {
      if (!isAuthenticated) {
        setFavorites((current) =>
          current.includes(pizzaId) ? current : [...current, pizzaId]
        );
        return;
      }

      // Optimistic here, unlike Cart's mutations — a favorite toggle
      // has no price/quantity correctness at stake, and the
      // idempotent upsert on the server means even a failed/duplicate
      // request can't corrupt anything. Instant heart-fill feedback is
      // worth more here than waiting on a round trip that Cart
      // deliberately doesn't skip.
      setFavorites((current) =>
        current.includes(pizzaId) ? current : [...current, pizzaId]
      );
      void fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ pizzaId: Number(pizzaId) }),
      }).catch(() => {
        // Reconcile with the server's actual state on failure, rather
        // than leaving the optimistic update possibly wrong.
        void fetchServerFavorites();
      });
    },
    [isAuthenticated, authHeader, fetchServerFavorites]
  );

  const removeFavorite = useCallback(
    (pizzaId: string) => {
      if (!isAuthenticated) {
        setFavorites((current) => current.filter((id) => id !== pizzaId));
        return;
      }

      setFavorites((current) => current.filter((id) => id !== pizzaId));
      void fetch(`/api/favorites/${pizzaId}`, {
        method: "DELETE",
        headers: authHeader(),
      }).catch(() => {
        void fetchServerFavorites();
      });
    },
    [isAuthenticated, authHeader, fetchServerFavorites]
  );

  const toggleFavorite = useCallback(
    (pizzaId: string) => {
      if (favorites.includes(pizzaId)) {
        removeFavorite(pizzaId);
      } else {
        addFavorite(pizzaId);
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  const isFavorite = useCallback(
    (pizzaId: string) => favorites.includes(pizzaId),
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    if (!isAuthenticated) {
      favoritesStorage.clear();
    }
  }, [isAuthenticated]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      favoriteCount: favorites.length,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite,
      clearFavorites,
    }),
    [favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite, clearFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}