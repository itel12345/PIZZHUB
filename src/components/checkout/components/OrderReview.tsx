// src/components/checkout/components/OrderReview.tsx
//
// Reads order data directly from the existing useCart() context — no
// duplicated cart logic, no separate checkout-side item list. Renders a
// read-only summary row per item (name, quantity, unit price, line
// total) — deliberately NOT the interactive CartItem component, since
// stepper/remove controls don't belong at checkout.
//
// Delivery fee and tax rate come from usePublicSettings() (live
// Settings) instead of local constants — this preview now matches what
// the server actually charges (see lib/orders.ts / lib/settings.ts's
// computeTax), rather than risking two different numbers.

"use client";

import Image from "next/image";
import { useCart } from "@/components/cart";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import type { PublicSiteSettingsDTO } from "@/lib/settings";
import styles from "./OrderReview.module.css";

interface OrderReviewProps {
  /** Server-fetched settings, threaded down from
   * app/checkout/page.tsx — when present, skips the client fetch
   * entirely so delivery fee/tax are correct on the very first paint. */
  initialSettings?: PublicSiteSettingsDTO;
}

export default function OrderReview({ initialSettings }: OrderReviewProps) {
  const { items, subtotal } = useCart();
  const { deliveryFee, taxRate } = usePublicSettings(initialSettings);

  // Same rounding as lib/settings.ts's computeTax — kept in sync
  // deliberately rather than importing a server-only module into a
  // client component.
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const grandTotal = subtotal + deliveryFee + tax;

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
          <dd>${deliveryFee.toFixed(2)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Tax</dt>
          <dd>${tax.toFixed(2)}</dd>
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