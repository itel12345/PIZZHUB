// src/components/admin/orders/components/Pagination.tsx
//
// Same pattern as Products' Pagination component, scoped to
// /admin/orders and its own query params (status, not category) —
// not modified in place because that component hardcodes the
// /admin/products path and Products-specific params; generalizing it
// risked destabilizing a working, unrelated page for this task's sake.

import Link from "next/link";
import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number;
  totalPages: number;
  query: string;
  status: string;
}

function buildHref(page: number, query: string, status: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status && status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default function Pagination({ page, totalPages, query, status }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label="Order pages" className={styles.nav}>
      {hasPrev ? (
        <Link href={buildHref(page - 1, query, status)} className={styles.link}>
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
        <Link href={buildHref(page + 1, query, status)} className={styles.link}>
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
