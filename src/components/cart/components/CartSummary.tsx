"use client";

import { useRouter } from "next/navigation";
import { useCart } from "../hooks/useCart";
import styles from "./CartSummary.module.css";

// Temporary fixed delivery fee. TODO: replace with real delivery pricing
// logic (distance/zone-based) once backend delivery rules exist.
const DELIVERY_FEE = 15;

/**
 * CartSummary
 *
 * Order summary panel: subtotal (derived from cart), fixed delivery fee,
 * grand total, and the "Proceed to Checkout" button. Checkout itself is
 * out of scope for this phase — the button only navigates to /checkout.
 */
export function CartSummary() {
  const { subtotal, itemCount } = useCart();
  const router = useRouter();

  const grandTotal = subtotal + DELIVERY_FEE;

  return (
    <aside className={styles.summary} aria-label="Order summary">
      <h2 className={styles.heading}>Order Summary</h2>

      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</dt>
          <dd>${subtotal.toFixed(2)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Delivery Fee</dt>
          <dd>${DELIVERY_FEE.toFixed(2)}</dd>
        </div>
      </dl>

      <div className={styles.divider} />

      <div className={styles.grandTotalRow}>
        <span>Grand Total</span>
        <span className={styles.grandTotalValue}>${grandTotal.toFixed(2)}</span>
      </div>

      <button
        type="button"
        className={styles.checkoutButton}
        onClick={() => router.push("/checkout")}
      >
        Proceed to Checkout
      </button>
    </aside>
  );
}