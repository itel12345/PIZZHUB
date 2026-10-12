// src/components/admin/customers/page/CustomersPage.tsx

import type { AdminCustomerListItem, AdminCustomerRoleFilter } from "@/lib/customers";
import CustomersToolbar from "../components/CustomersToolbar";
import CustomersTable from "../components/CustomersTable";
import Pagination from "../components/Pagination";
import styles from "./CustomersPage.module.css";

interface CustomersPageProps {
  customers: AdminCustomerListItem[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
  role: AdminCustomerRoleFilter;
}

export default function CustomersPage({
  customers,
  total,
  page,
  totalPages,
  query,
  role,
}: CustomersPageProps) {
  const hasFilters = query.length > 0 || role !== "all";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>
            {total} {total === 1 ? "customer" : "customers"}
            {hasFilters ? " (filtered)" : ""}
          </p>
        </div>
      </div>

      <CustomersToolbar query={query} role={role} />

      <CustomersTable customers={customers} />

      <Pagination page={page} totalPages={totalPages} query={query} role={role} />
    </div>
  );
}