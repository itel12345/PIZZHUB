import Image from "next/image";
import { useCart } from "../hooks/useCart";
import type { CartItem as CartItemType } from "../storage/cartStorage";
import styles from "./CartItem.module.css";

interface CartItemProps {
  item: CartItemType;
}

/**
 * CartItem
 *
 * Renders a single cart line: image, name, unit price, quantity stepper,
 * line total, and a remove control. Quantity changes and removal go
 * straight through useCart — this component holds no local state of
 * its own, so it can never drift out of sync with the cart context.
 */
export function CartItem({ item }: CartItemProps) {
  // Quantity/remove actions are optimistic (see CartContext) — the UI
  // updates instantly, so there's no isLoading-gated disable here.
  // What actually matters for correctness under rapid clicks is fixed
  // in CartContext itself (functional state updates, not a stale
  // closure), not by blocking the button.
  const { increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  const lineTotal = item.price * item.quantity;
  const isAtMinimum = item.quantity <= 1;

  return (
    <div className={styles.item}>
      <div className={styles.imageWrapper}>
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="96px"
          className={styles.image}
        />
      </div>

      <div className={styles.details}>
        <h3 className={styles.name}>{item.name}</h3>
        <p className={styles.unitPrice}>${item.price.toFixed(2)} each</p>
      </div>

      <div className={styles.stepper} role="group" aria-label={`Quantity for ${item.name}`}>
        <button
          type="button"
          className={styles.stepperButton}
          onClick={() => decreaseQuantity(item.pizzaId)}
          disabled={isAtMinimum}
          aria-disabled={isAtMinimum}
          aria-label={`Decrease quantity of ${item.name}`}
        >
          −
        </button>
        <span className={styles.quantity} aria-live="polite">
          {item.quantity}
        </span>
        <button
          type="button"
          className={styles.stepperButton}
          onClick={() => increaseQuantity(item.pizzaId)}
          aria-label={`Increase quantity of ${item.name}`}
        >
          +
        </button>
      </div>

      <div className={styles.lineTotal}>${lineTotal.toFixed(2)}</div>

      <button
        type="button"
        className={styles.removeButton}
        onClick={() => removeFromCart(item.pizzaId)}
        aria-label={`Remove ${item.name} from cart`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L7 7h10Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}