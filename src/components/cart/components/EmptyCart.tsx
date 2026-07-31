import Link from "next/link";
import styles from "./EmptyCart.module.css";

/**
 * EmptyCart
 *
 * Shown when the cart has zero items. Mirrors the Favorites empty state:
 * outlined illustration, heading, description, single orange CTA back
 * into the shopping flow.
 */
export function EmptyCart() {
  return (
    <div className={styles.emptyState} role="status">
      <div className={styles.illustration} aria-hidden="true">
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="48"
            cy="48"
            r="47"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.25"
          />
          <path
            d="M28 34h4l4.5 32a4 4 0 0 0 4 3.4h20.6a4 4 0 0 0 4-3.4L69.5 44H35"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="41" cy="76" r="3.2" stroke="currentColor" strokeWidth="2" />
          <circle cx="59" cy="76" r="3.2" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <h2 className={styles.heading}>Your cart is empty</h2>
      <p className={styles.description}>
        Looks like you haven&apos;t added any pizzas yet. Browse the menu and
        find something delicious to order.
      </p>

      <Link href="/menu" className={styles.browseButton}>
        Browse the Menu
      </Link>
    </div>
  );
}