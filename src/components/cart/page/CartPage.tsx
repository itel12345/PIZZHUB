"use client";

import { useCart } from "../hooks/useCart";
import { CartItem } from "../components/CartItem";
import { CartSummary } from "../components/CartSummary";
import { EmptyCart } from "../components/EmptyCart";
import styles from "./CartPage.module.css";

/**
 * CartPage
 *
 * Content for the /cart route. Renders as a <div>, not <main> — the
 * src/app/cart/page.tsx route already supplies its own <main> wrapper
 * (same convention as every other page), so this stays a plain
 * container to avoid nesting two <main> landmarks. No background is
 * set on `.page` (see Layer 4 note in globals.css) so the ambient glow
 * container shows through, matching Menu/PizzaDetails/Favorites pages.
 */
export function CartPage() {
  const { items } = useCart();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Shopping Cart</h1>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className={styles.layout}>
            <section className={styles.itemsColumn} aria-label="Cart items">
              {items.map((item) => (
                <CartItem key={item.pizzaId} item={item} />
              ))}
            </section>

            <div className={styles.summaryColumn}>
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}