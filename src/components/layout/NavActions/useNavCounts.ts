// src/components/layout/NavActions/useNavCounts.ts
// TEMPORARY mock counters for the Cart and Favorites nav icons. Local state
// only — no persistence, no backend.
//
// Future integration: Cart count should come from a CartContext/store once
// the shopping cart is built; Favorites count should come from the
// User → Favorites relation once auth + database are connected. Both are
// exposed here as plain numbers so NavActions doesn't need to change shape
// when the real sources arrive — only this hook's internals do.

"use client";

import { useState } from "react";

export function useNavCounts() {
  // Seeded with sample values purely so the badges are visible in review;
  // set both to 0 once wiring up real data.
  const [cartCount] = useState(3);
  const [favoritesCount] = useState(5);

  return { cartCount, favoritesCount };
}