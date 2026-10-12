// src/components/admin/orders/components/OrdersToolbar.tsx
//
// Same plain <form method="get"> pattern as Products' ProductsToolbar —
// the list page is a server component reading searchParams, so a
// native form submit needs no client state to stay in sync with the URL.

import styles from "./OrdersToolbar.module.css";

interface OrdersToolbarProps {
  query: string;
  status: string;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersToolbar({ query, status }: OrdersToolbarProps) {
  return (
    <form method="get" className={styles.toolbar} role="search" aria-label="Filter orders">
      <div className={styles.field}>
        <label htmlFor="q" className={styles.visuallyHidden}>
          Search by customer or order id
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by customer name, email, or order id…"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="status" className={styles.visuallyHidden}>
          Status
        </label>
        <select id="status" name="status" defaultValue={status} className={styles.select}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
