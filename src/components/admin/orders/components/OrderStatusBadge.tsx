// src/components/admin/orders/components/OrderStatusBadge.tsx
//
// Shared between OrdersTable and OrderDetailPage so status coloring
// can't drift between the list and detail views.

import styles from "./OrderStatusBadge.module.css";

interface OrderStatusBadgeProps {
  status: "pending" | "confirmed" | "cancelled";
}

const LABELS: Record<OrderStatusBadgeProps["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {LABELS[status]}
    </span>
  );
}
