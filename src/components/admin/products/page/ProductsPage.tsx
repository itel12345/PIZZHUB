// src/components/admin/products/page/ProductsPage.tsx

import Link from "next/link";
import type { Pizza } from "@/lib/pizza";
import { CATEGORY_OPTIONS } from "../types";
import ProductsTable from "../components/ProductsTable";
import ProductsToolbar from "../components/ProductsToolbar";
import Pagination from "../components/Pagination";
import styles from "./ProductsPage.module.css";

interface ProductsPageProps {
  pizzas: Pizza[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
  sort: string;
  category?: string;
}

export default function ProductsPage({
  pizzas,
  total,
  page,
  totalPages,
  query,
  sort,
  category,
}: ProductsPageProps) {
  const hasFilters = query.length > 0 || Boolean(category);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        {/* suppressHydrationWarning: a browser extension (e.g.
            Bitdefender's) injects a bis_skin_checked attribute onto
            this div between server render and client hydration — a
            false-positive mismatch that isn't caused by anything in
            this app. Scoped to just this one node, not silencing
            hydration warnings anywhere else. */}
        <div suppressHydrationWarning>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.subtitle}>
            {total} {total === 1 ? "pizza" : "pizzas"} in the menu
            {hasFilters ? " (filtered)" : ""}
          </p>
        </div>

        <Link href="/admin/products/new" className={styles.addButton}>
          + Add Pizza
        </Link>
      </div>

      <ProductsToolbar
        query={query}
        sort={sort}
        category={category}
        categories={CATEGORY_OPTIONS}
      />

      <ProductsTable pizzas={pizzas} />

      <Pagination
        page={page}
        totalPages={totalPages}
        query={query}
        sort={sort}
        category={category}
      />
    </div>
  );
}
