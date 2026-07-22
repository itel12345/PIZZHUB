// src/components/menu/hooks/useMenuFilters.ts
// Owns all UI-only state for the Menu page: search term, active category,
// sort order, and how many results are currently revealed ("Load more").
// Pure client-side filtering over the static mock data — no network calls.

"use client";

import { useMemo, useState, useCallback } from "react";
import { pizzas, type Pizza, type PizzaCategory } from "../data/pizzas";

export type SortOption = "recommended" | "price-asc" | "price-desc" | "rating" | "newest";

export const CATEGORIES: Array<PizzaCategory | "All"> = [
  "All",
  "Classic",
  "Signature",
  "Spicy",
  "Vegetarian",
  "Desserts",
  "Drinks",
];

const PAGE_SIZE = 8;

export function useMenuFilters() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered: Pizza[] = useMemo(() => {
    let result = pizzas;

    if (category !== "All") {
      result = result.filter((p) => p.category === category);
    }

    const query = search.trim().toLowerCase();
    if (query.length > 0) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.ingredients.some((i) => i.toLowerCase().includes(query))
      );
    }

    const sorted = [...result];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        sorted.sort((a, b) => b.addedAt - a.addedAt);
        break;
      default:
        // "recommended" keeps the curated catalogue order
        break;
    }

    return sorted;
  }, [search, category, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = filtered.length - visible.length;

  const loadMore = useCallback(() => {
    setVisibleCount((count) => count + PAGE_SIZE);
  }, []);

  // Any change to search/category/sort should reset pagination back to page one.
  const updateSearch = useCallback((value: string) => {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const updateCategory = useCallback((value: (typeof CATEGORIES)[number]) => {
    setCategory(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const updateSort = useCallback((value: SortOption) => {
    setSort(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  return {
    search,
    category,
    sort,
    results: visible,
    totalCount: filtered.length,
    hasMore,
    remaining,
    setSearch: updateSearch,
    setCategory: updateCategory,
    setSort: updateSort,
    loadMore,
  };
}
