// src/components/profile/components/OrderHistoryList.tsx
//
// Reuses the full OrderDTO already returned by useOrders() for the
// "view details" expansion — no second per-order fetch, no separate
// detail route. Label maps/formatters are duplicated from
// OrderSuccessPage.tsx rather than imported, matching that file's own
// stated precedent: two small local Records are simpler than
// restructuring shared files for this.

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useOrders, type Order } from "@/components/orders";
import styles from "./OrderHistoryList.module.css";

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  standard: "Standard Delivery",
  express: "Express Delivery",
  pickup: "Pickup",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  momo: "Mobile Money",
};

const STATUS_LABELS: Record<Order["status"], string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
};

function formatPlacedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatAddress(order: Order): string {
  const { street, city, region, postalCode } = order.address;
  const parts = [street, city, region].filter(Boolean);
  const line = parts.join(", ");
  return postalCode ? `${line}, ${postalCode}` : line;
}

function OrderRow({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.summaryButton}
        onClick={() => setIsExpanded((value) => !value)}
        aria-expanded={isExpanded}
      >
        <div className={styles.summaryMain}>
          <span className={styles.orderId}>#{order.id.slice(-8)}</span>
          <span className={styles.placedAt}>{formatPlacedAt(order.placedAt)}</span>
        </div>

        <div className={styles.summaryMeta}>
          <span className={`${styles.statusBadge} ${styles[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
          <span className={styles.itemCount}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
          <span className={styles.total}>${order.total.toFixed(2)}</span>
          <span className={styles.chevron} aria-hidden="true">
            {isExpanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {isExpanded ? (
        <div className={styles.details}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailBlock}>
              <h3 className={styles.detailHeading}>Items</h3>
              <ul className={styles.items}>
                {order.items.map((item) => (
                  <li key={item.pizzaId} className={styles.item}>
                    <div className={styles.itemImageWrapper}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className={styles.itemImage}
                      />
                    </div>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemMeta}>
                        Qty {item.quantity} · ${item.price.toFixed(2)} each
                      </span>
                    </div>
                    <span className={styles.itemTotal}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className={styles.totalsGrid}>
                <div className={styles.totalRow}>
                  <dt>Subtotal</dt>
                  <dd>${order.subtotal.toFixed(2)}</dd>
                </div>
                <div className={styles.totalRow}>
                  <dt>Delivery Fee</dt>
                  <dd>${order.deliveryFee.toFixed(2)}</dd>
                </div>
                <div className={styles.totalRow}>
                  <dt>Tax</dt>
                  <dd>${order.tax.toFixed(2)}</dd>
                </div>
                <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
                  <dt>Total</dt>
                  <dd>${order.total.toFixed(2)}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.detailBlock}>
              <h3 className={styles.detailHeading}>Delivery &amp; payment</h3>
              <dl className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <dt>Delivery Method</dt>
                  <dd>
                    {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
                  </dd>
                </div>
                <div className={styles.infoRow}>
                  <dt>Payment Method</dt>
                  <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt>Delivery Address</dt>
                  <dd>{formatAddress(order)}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt>Delivery Instructions</dt>
                  <dd>{order.address.deliveryInstructions || "None"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function OrderHistorySkeleton() {
  return (
    <ul className={styles.list} aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className={`${styles.row} ${styles.skeletonRow}`} />
      ))}
    </ul>
  );
}

export function OrderHistoryList() {
  const { orders, isLoading, hasError, page, totalPages, goToPage, retry } = useOrders();

  if (isLoading) {
    return <OrderHistorySkeleton />;
  }

  if (hasError) {
    return (
      <div className={styles.empty}>
        <p>Couldn&apos;t load your orders. This is usually temporary.</p>
        <button type="button" className={styles.retryButton} onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <p>You haven&apos;t placed any orders yet.</p>
        <Link href="/menu" className={styles.menuLink}>
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className={styles.list}>
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </ul>

      {totalPages > 1 ? (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageButton}
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            ← Previous
          </button>
          <span className={styles.pageStatus}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageButton}
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next →
          </button>
        </div>
      ) : null}
    </>
  );
}