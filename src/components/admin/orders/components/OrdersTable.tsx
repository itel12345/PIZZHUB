// src/components/admin/orders/components/OrdersTable.tsx

import Link from "next/link";
import type { AdminOrderListItem } from "@/lib/orders";
import OrderStatusBadge from "./OrderStatusBadge";
import styles from "./OrdersTable.module.css";

interface OrdersTableProps {
  orders: AdminOrderListItem[];
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  momo: "Mobile Money",
  mobile_money: "Mobile Money",
  card: "Card",
};

export default function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No orders match these filters.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">Customer</th>
            <th scope="col">Placed</th>
            <th scope="col">Items</th>
            <th scope="col">Total</th>
            <th scope="col">Payment</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className={styles.visuallyHidden}>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td data-label="Order" className={styles.idCell}>
                {order.id.slice(0, 8)}…
              </td>
              <td data-label="Customer">
                <div className={styles.customerName}>{order.customer.fullName}</div>
                <div className={styles.customerEmail}>{order.customer.email}</div>
              </td>
              <td data-label="Placed">{formatDate(order.placedAt)}</td>
              <td data-label="Items">{order.itemCount}</td>
              <td data-label="Total">GHS {order.total.toFixed(2)}</td>
              <td data-label="Payment">
                {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </td>
              <td data-label="Status">
                <OrderStatusBadge status={order.status} />
              </td>
              <td data-label="" className={styles.actionsCell}>
                <Link href={`/admin/orders/${order.id}`} className={styles.viewLink}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
