// src/components/menu/CategoryFilters/CategoryFilters.tsx
// Horizontal row of category chips. Renders as a scrollable rail on mobile,
// a single row on larger screens. Exactly one active state at a time.

"use client";

import { CATEGORIES } from "../hooks/useMenuFilters";
import type { PizzaCategory } from "../data/pizzas";
import styles from "./CategoryFilters.module.css";

interface CategoryFiltersProps {
  active: PizzaCategory | "All";
  onChange: (category: PizzaCategory | "All") => void;
}

export default function CategoryFilters({ active, onChange }: CategoryFiltersProps) {
  return (
    <div className={styles.rail} role="tablist" aria-label="Filter by category">
      {CATEGORIES.map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
            onClick={() => onChange(category)}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
