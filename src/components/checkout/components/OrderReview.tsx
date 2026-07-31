// src/components/checkout/components/OrderReview.tsx
//
// Reads order data directly from the existing useCart() context — no
// duplicated cart logic, no separate checkout-side item list. Renders a
// read-only summary row per item (name, quantity, unit price, line
// total) — deliberately NOT the interactive CartItem component, since
// stepper/remove controls don't belong at checkout.
//
// DELIVERY_FEE is a local constant for now, matching CartSummary's
// pattern, kept separate to avoid touching Cart's files in this phase.
// TODO: extract to a single shared constant once Cart and Checkout need
// to guarantee they can never show two different delivery fees.

"use client";

import Image from "next/image";
import { useCart } from "@/components/cart";
import styles from "./OrderReview.module.css";

const DELIVERY_FEE = 15;
const TAX = 0; // TODO: real tax calculation

export default function OrderReview() {
  const { items, subtotal } = useCart();

  const grandTotal = subtotal + DELIVERY_FEE + TAX;

  return (
    <aside className={styles.review} aria-label="Order review">
      <h2 className={styles.heading}>Order Review</h2>

      <ul className={styles.items}>
        {items.map((item) => (
          <li key={item.pizzaId} className={styles.item}>
            <div className={styles.imageWrapper}>
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="56px"
                className={styles.image}
              />
            </div>

            <div className={styles.itemDetails}>
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

      <div className={styles.divider} />

      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt>Subtotal</dt>
          <dd>${subtotal.toFixed(2)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Delivery Fee</dt>
          <dd>${DELIVERY_FEE.toFixed(2)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Tax</dt>
          <dd>${TAX.toFixed(2)}</dd>
        </div>
      </dl>

      <div className={styles.divider} />

      <div className={styles.grandTotalRow}>
        <span>Grand Total</span>
        <span className={styles.grandTotalValue}>${grandTotal.toFixed(2)}</span>
      </div>
    </aside>
  );
}