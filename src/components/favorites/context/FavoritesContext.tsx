// src/components/favorites/context/FavoritesContext.tsx
//
// Single source of truth for favorites across the whole app. No component
// should read/write localStorage or manage its own favorite state — every
// component goes through this Context (via the useFavorites hook in
// ../hooks/useFavorites.ts).

"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
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

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  // Start empty on both the server render and the initial client render
  // so hydration matches exactly (same reasoning as useScrollReveal's
  // SSR-safety) — the real stored values are loaded in an effect right
  // after mount instead.
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  useEffect(() => {
    setFavorites(favoritesStorage.load());
    setHasLoadedFromStorage(true);
  }, []);

  // Persist on every change — but only after the initial load has
  // actually happened, so this doesn't overwrite real stored data with
  // an empty array during that first render before load() runs.
  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    favoritesStorage.save(favorites);
  }, [favorites, hasLoadedFromStorage]);

  const addFavorite = useCallback((pizzaId: string) => {
    setFavorites((current) => (current.includes(pizzaId) ? current : [...current, pizzaId]));
  }, []);

  const removeFavorite = useCallback((pizzaId: string) => {
    setFavorites((current) => current.filter((id) => id !== pizzaId));
  }, []);

  const toggleFavorite = useCallback((pizzaId: string) => {
    setFavorites((current) =>
      current.includes(pizzaId) ? current.filter((id) => id !== pizzaId) : [...current, pizzaId]
    );
  }, []);

  const isFavorite = useCallback(
    (pizzaId: string) => favorites.includes(pizzaId),
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

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