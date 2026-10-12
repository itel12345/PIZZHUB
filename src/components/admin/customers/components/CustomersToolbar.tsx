// src/components/admin/customers/components/CustomersToolbar.tsx
//
// Same plain <form method="get"> pattern as Orders' OrdersToolbar —
// the list page is a server component reading searchParams, so a
// native form submit needs no client state to stay in sync with the URL.

import type { AdminCustomerRoleFilter } from "@/lib/customers";
import styles from "./CustomersToolbar.module.css";

interface CustomersToolbarProps {
  query: string;
  role: AdminCustomerRoleFilter;
}

const ROLE_OPTIONS: { value: AdminCustomerRoleFilter; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "user", label: "Customers" },
  { value: "admin", label: "Admins" },
];

export default function CustomersToolbar({ query, role }: CustomersToolbarProps) {
  return (
    <form method="get" className={styles.toolbar} role="search" aria-label="Filter customers">
      <div className={styles.field}>
        <label htmlFor="q" className={styles.visuallyHidden}>
          Search by name, email, or user id
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by name, email, or user id…"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="role" className={styles.visuallyHidden}>
          Role
        </label>
        <select id="role" name="role" defaultValue={role} className={styles.select}>
          {ROLE_OPTIONS.map((option) => (
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