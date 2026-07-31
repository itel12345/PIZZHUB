"use client";

import { useMemo, useState, useCallback, useEffect } from "react";

export interface Pizza {
  id: string;
  dbId: number;
  name: string;
  description: string;
  ingredients: string[];
  category:
    | "Classic"
    | "Signature"
    | "Spicy"
    | "Vegetarian"
    | "Desserts"
    | "Drinks";
  price: number;
  rating: number;
  image: string;
  isPremium?: boolean;
  addedAt: number;
}

export type PizzaCategory = Pizza["category"];

export type SortOption =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest";

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
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>("All");
  const [sort, setSort] =
    useState<SortOption>("recommended");
  const [visibleCount, setVisibleCount] =
    useState(PAGE_SIZE);

  useEffect(() => {
    async function loadPizzas() {
      try {
        const response = await fetch("/api/pizzas");

        if (!response.ok) {
          throw new Error("Failed to load pizzas.");
        }

        const data = await response.json();

        setPizzas(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadPizzas();
  }, []);

  const filtered = useMemo(() => {
    let result = pizzas;

    if (category !== "All") {
      result = result.filter(
        (pizza) => pizza.category === category
      );
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (pizza) =>
          pizza.name.toLowerCase().includes(query) ||
          pizza.ingredients.some((ingredient) =>
            ingredient.toLowerCase().includes(query)
          )
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
        break;
    }

    return sorted;
  }, [pizzas, search, category, sort]);

  const visible = filtered.slice(0, visibleCount);

  const remaining =
    filtered.length - visible.length;

  const hasMore =
    visibleCount < filtered.length;

  const loadMore = useCallback(() => {
    setVisibleCount((count) => count + PAGE_SIZE);
  }, []);

  const updateSearch = useCallback((value: string) => {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const updateCategory = useCallback(
    (value: (typeof CATEGORIES)[number]) => {
      setCategory(value);
      setVisibleCount(PAGE_SIZE);
    },
    []
  );

  const updateSort = useCallback(
    (value: SortOption) => {
      setSort(value);
      setVisibleCount(PAGE_SIZE);
    },
    []
  );

  return {
    loading,
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