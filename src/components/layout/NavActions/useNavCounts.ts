// src/components/layout/NavActions/useNavCounts.ts
//
// DEPRECATED as of Phase 4.2 — nothing imports this anymore.
// Favorites moved to the real useFavorites() context in Phase 4.3, and
// Cart moved to the real useCart() context in Phase 4.2. Both counts now
// come straight from their respective contexts in Navbar.tsx.
//
// Safe to delete this file entirely. Left as an empty stub only in case
// a future nav badge needs a temporary mock home before its real data
// source exists.

"use client";

export function useNavCounts() {
  return {};
}