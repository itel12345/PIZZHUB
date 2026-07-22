// src/components/menu/FilterSortRow/FilterSortRow.tsx
// A single, understated row: result count on the left, sort control on the
// right. Deliberately not overcomplicated — the brief asked for restraint.

"use client";

import type { SortOption } from "../hooks/useMenuFilters";
import styles from "./FilterSortRow.module.css";

interface FilterSortRowProps {
  sort: SortOption;
  onChange: (sort: SortOption) => void;
  resultCount: number;
}

const SORT_LABELS: Record<SortOption, string> = {
  recommended: "Recommended",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Highest Rated",
  newest: "Newest",
};

export default function FilterSortRow({ sort, onChange, resultCount }: FilterSortRowProps) {
  return (
    <div className={styles.row}>
      <p className={styles.count}>
        {resultCount} {resultCount === 1 ? "pizza" : "pizzas"}
      </p>

      <label className={styles.sortControl}>
        <span className={styles.sortLabel}>Sort</span>
        <select
          className={styles.select}
          value={sort}
          onChange={(event) => onChange(event.target.value as SortOption)}
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </label>
    </div>
  );
}
