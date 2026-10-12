// src/components/admin/orders/page/OrderDetailPage.tsx

import Link from "next/link";
import type { OrderDTO } from "@/lib/orders";
import OrderStatusBadge from "../components/OrderStatusBadge";
import OrderStatusControl from "../components/OrderStatusControl";
import styles from "./OrderDetailPage.module.css";

interface OrderDetailPageProps {
  order: OrderDTO;
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

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  standard: "Standard Delivery",
  express: "Express Delivery",
  pickup: "Pickup",
};

// OrderDTO.status is lowercase (matches the customer-facing pages);
// OrderStatusControl works with the Prisma enum's actual uppercase
// values directly, since that's what the PATCH endpoint expects. An
// explicit map here, rather than a .toUpperCase() type assertion,
// keeps this a real, checked correspondence instead of an assertion
// that TypeScript can't actually verify is safe.
const TO_ENUM_STATUS: Record<OrderDTO["status"], "PENDING" | "CONFIRMED" | "CANCELLED"> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
};

export default function OrderDetailPage({ order }: OrderDetailPageProps) {
  return (
    <div className={styles.page}>
      <Link href="/admin/orders" className={styles.backLink}>
        ← All orders
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Order {order.id.slice(0, 8)}…</h1>
          <p className={styles.subtitle}>Placed {formatDate(order.placedAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className={styles.card}>
        <OrderStatusControl orderId={order.id} currentStatus={TO_ENUM_STATUS[order.status]} />
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardHeading}>Customer</h2>
          <dl className={styles.detailList}>
            <div>
              <dt>Name</dt>
              <dd>{order.customer.fullName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{order.customer.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{order.customer.phone}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardHeading}>Delivery</h2>
          <dl className={styles.detailList}>
            <div>
              <dt>Address</dt>
              <dd>
                {order.address.street}, {order.address.city}, {order.address.region}
                {order.address.postalCode ? `, ${order.address.postalCode}` : ""}
              </dd>
            </div>
            {order.address.deliveryInstructions && (
              <div>
                <dt>Instructions</dt>
                <dd>{order.address.deliveryInstructions}</dd>
              </div>
            )}
            <div>
              <dt>Method</dt>
              <dd>{DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Items</h2>
        <ul className={styles.itemsList}>
          {order.items.map((item) => (
            <li key={item.pizzaId} className={styles.item}>
              <span className={styles.itemName}>
                {item.name} <span className={styles.itemQty}>× {item.quantity}</span>
              </span>
              <span className={styles.itemPrice}>
                GHS {(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>GHS {order.subtotal.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Delivery fee</dt>
            <dd>GHS {order.deliveryFee.toFixed(2)}</dd>
          </div>
          <div className={styles.totalRow}>
            <dt>Total</dt>
            <dd>GHS {order.total.toFixed(2)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
