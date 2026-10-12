// src/components/admin/products/components/ProductsToolbar.tsx
//
// A plain <form method="get">, not a client component with onChange
// handlers — the whole list page is a server component that reads
// searchParams, so a native form submit is simpler, works with JS
// disabled, and needs zero client-side state to stay in sync with the
// URL (which is already the single source of truth for page/sort/query).

import type { PizzaCategory } from "@/lib/pizza";
import styles from "./ProductsToolbar.module.css";

interface ProductsToolbarProps {
  query: string;
  sort: string;
  category?: string;
  categories: PizzaCategory[];
}

const SORT_LABELS: Record<string, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "name-asc": "Name (A–Z)",
  "name-desc": "Name (Z–A)",
  "price-asc": "Price (low to high)",
  "price-desc": "Price (high to low)",
};

export default function ProductsToolbar({
  query,
  sort,
  category,
  categories,
}: ProductsToolbarProps) {
  return (
    <form method="get" className={styles.toolbar} role="search" aria-label="Filter products">
      <div className={styles.field}>
        <label htmlFor="q" className={styles.visuallyHidden}>
          Search by name
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search pizzas by name…"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="category" className={styles.visuallyHidden}>
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={category ?? ""}
          className={styles.select}
        >
          <option value="">All categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="sort" className={styles.visuallyHidden}>
          Sort
        </label>
        <select id="sort" name="sort" defaultValue={sort} className={styles.select}>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className={styles.applyButton}>
        Apply
      </button>
    </form>
  );
}
