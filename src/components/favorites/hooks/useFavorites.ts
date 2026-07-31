// src/components/favorites/hooks/useFavorites.ts
//
// The only way any component should read or mutate favorites. Never call
// useContext(FavoritesContext) directly anywhere else in the app — always
// go through this hook.

"use client";

import { useContext } from "react";
import { FavoritesContext } from "../context/FavoritesContext";

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      "useFavorites must be used within a <FavoritesProvider>. " +
        "Make sure src/app/layout.tsx wraps {children} with it."
    );
  }

  return context;
}