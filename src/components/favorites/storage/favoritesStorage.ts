// src/components/favorites/storage/favoritesStorage.ts
//
// The single place in the whole app allowed to touch localStorage for
// favorites. No component and no other file should read/write
// window.localStorage directly for this feature — everything goes through
// FavoritesContext, which only ever calls the three functions below.
//
// FUTURE DATABASE SWAP: when Prisma/auth are ready, this file is what
// changes — load()/save()/clear() become async calls to
// prisma.favorite.findMany/create/delete (or API routes wrapping them).
// FavoritesContext's public shape (favorites, toggleFavorite, etc.) can
// stay identical, so no UI component needs to change at all.

const STORAGE_KEY = "pizzhub:favorites";

function isValidFavoritesList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export const favoritesStorage = {
  /**
   * Reads favorite pizza IDs from localStorage. Returns an empty array
   * (never throws) if storage is unavailable, empty, or contains
   * malformed/corrupted data — favorites should degrade gracefully, not
   * crash the app.
   */
  load(): string[] {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed: unknown = JSON.parse(raw);
      return isValidFavoritesList(parsed) ? parsed : [];
    } catch {
      // Corrupted JSON, or localStorage inaccessible (e.g. some private
      // browsing modes) — treat it the same as "no favorites saved".
      return [];
    }
  },

  /**
   * Persists the full list of favorite pizza IDs, overwriting whatever
   * was there before. Fails silently on quota-exceeded or unavailable
   * storage — the in-memory Context state still works for the current
   * session even if persistence itself can't happen.
   */
  save(ids: string[]): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignore — e.g. storage full or blocked. Not fatal.
    }
  },

  /** Removes all saved favorites from localStorage. */
  clear(): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
  },
};