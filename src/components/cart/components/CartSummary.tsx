"use client";

import { useRouter } from "next/navigation";
import { useCart } from "../hooks/useCart";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import type { PublicSiteSettingsDTO } from "@/lib/settings";
import styles from "./CartSummary.module.css";

interface CartSummaryProps {
  /** Server-fetched settings, threaded down from app/cart/page.tsx —
   * when present, skips the client fetch entirely so delivery fee is
   * correct on the very first paint, not a moment after. */
  initialSettings?: PublicSiteSettingsDTO;
}

/**
 * CartSummary
 *
 * Order summary panel: subtotal (derived from cart), delivery fee (live
 * from Settings — see usePublicSettings), grand total, and the "Proceed
 * to Checkout" button. Checkout itself is out of scope for this phase —
 * the button only navigates to /checkout.
 */
export function CartSummary({ initialSettings }: CartSummaryProps) {
  const { subtotal, itemCount } = useCart();
  const { deliveryFee } = usePublicSettings(initialSettings);
  const router = useRouter();

  const grandTotal = subtotal + deliveryFee;

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
          <dd>${deliveryFee.toFixed(2)}</dd>
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