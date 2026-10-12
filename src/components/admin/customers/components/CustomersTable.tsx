// src/components/admin/customers/components/CustomersTable.tsx

import type { AdminCustomerListItem } from "@/lib/customers";
import RoleBadge from "./RoleBadge";
import styles from "./CustomersTable.module.css";

interface CustomersTableProps {
  customers: AdminCustomerListItem[];
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function CustomersTable({ customers }: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No customers match these filters.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Customer</th>
            <th scope="col">Role</th>
            <th scope="col">Joined</th>
            <th scope="col">Orders</th>
            <th scope="col">Total spent</th>
            <th scope="col">Favorites</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td data-label="Customer">
                <div className={styles.customerName}>{customer.name}</div>
                <div className={styles.customerEmail}>{customer.email}</div>
              </td>
              <td data-label="Role">
                <RoleBadge role={customer.role} />
              </td>
              <td data-label="Joined">{formatDate(customer.joinedAt)}</td>
              <td data-label="Orders">{customer.orderCount}</td>
              <td data-label="Total spent">GHS {customer.totalSpent.toFixed(2)}</td>
              <td data-label="Favorites">{customer.favoriteCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}