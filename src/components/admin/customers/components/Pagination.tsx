// src/components/admin/customers/components/Pagination.tsx
//
// Same pattern as Orders' Pagination component, scoped to
// /admin/customers and its own query params (role, not status) — not
// shared with Orders/Products' pagination components because those
// hardcode their own path and param names; generalizing them risked
// destabilizing working, unrelated pages for this task's sake.

import Link from "next/link";
import type { AdminCustomerRoleFilter } from "@/lib/customers";
import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number;
  totalPages: number;
  query: string;
  role: AdminCustomerRoleFilter;
}

function buildHref(page: number, query: string, role: AdminCustomerRoleFilter) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (role && role !== "all") params.set("role", role);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/customers?${qs}` : "/admin/customers";
}

export default function Pagination({ page, totalPages, query, role }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label="Customer pages" className={styles.nav}>
      {hasPrev ? (
        <Link href={buildHref(page - 1, query, role)} className={styles.link}>
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
        <Link href={buildHref(page + 1, query, role)} className={styles.link}>
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