// src/components/admin/products/components/Pagination.tsx

import Link from "next/link";
import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number;
  totalPages: number;
  query: string;
  sort: string;
  category?: string;
}

function buildHref(page: number, query: string, sort: string, category?: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (sort && sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default function Pagination({
  page,
  totalPages,
  query,
  sort,
  category,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label="Product pages" className={styles.nav}>
      {hasPrev ? (
        <Link href={buildHref(page - 1, query, sort, category)} className={styles.link}>
          ← Previous
        </Link>
      ) : (
        <span className={styles.linkDisabled} aria-disabled="true">
          ← Previous
        </span>
      )}

      <span className={styles.status} aria-live="polite">
        Page {page} of {totalPages}
      </span>

      {hasNext ? (
        <Link href={buildHref(page + 1, query, sort, category)} className={styles.link}>
          Next →
        </Link>
      ) : (
        <span className={styles.linkDisabled} aria-disabled="true">
          Next →
        </span>
      )}
    </nav>
  );
}
