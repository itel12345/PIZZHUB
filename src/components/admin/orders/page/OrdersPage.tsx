// src/components/admin/orders/page/OrdersPage.tsx

import type { AdminOrderListItem, AdminOrderStatusFilter } from "@/lib/orders";
import OrdersToolbar from "../components/OrdersToolbar";
import OrdersTable from "../components/OrdersTable";
import Pagination from "../components/Pagination";
import styles from "./OrdersPage.module.css";

interface OrdersPageProps {
  orders: AdminOrderListItem[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
  status: AdminOrderStatusFilter;
}

export default function OrdersPage({
  orders,
  total,
  page,
  totalPages,
  query,
  status,
}: OrdersPageProps) {
  const hasFilters = query.length > 0 || status !== "all";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.subtitle}>
            {total} {total === 1 ? "order" : "orders"}
            {hasFilters ? " (filtered)" : ""}
          </p>
        </div>
      </div>

      <OrdersToolbar query={query} status={status} />

      <OrdersTable orders={orders} />

      <Pagination page={page} totalPages={totalPages} query={query} status={status} />
    </div>
  );
}
