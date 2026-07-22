// src/components/pizza-details/PizzaInformation/PizzaInformation.tsx
//
// Editorial identity block for the details page: category eyebrow, name,
// premium badge, rating, price, and the full (unclamped) description.

import type { Pizza } from "@/components/menu/data/pizzas";
import styles from "./PizzaInformation.module.css";

interface PizzaInformationProps {
  pizza: Pizza;
}

export default function PizzaInformation({ pizza }: PizzaInformationProps) {
  return (
    <div className={styles.info}>
      <div className={styles.topRow}>
        <span className={styles.category}>{pizza.category}</span>
        {pizza.isPremium && <span className={styles.badge}>Chef&apos;s Selection</span>}
      </div>

      <h1 className={styles.name}>{pizza.name}</h1>

      <div className={styles.meta}>
        <span className={styles.rating} aria-label={`Rated ${pizza.rating} out of 5`}>
          <svg viewBox="0 0 24 24" className={styles.star} aria-hidden="true">
            <path
              d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2z"
              fill="currentColor"
            />
          </svg>
          {pizza.rating.toFixed(1)}
        </span>
        <span className={styles.price}>GHS {pizza.price}</span>
      </div>

      <p className={styles.description}>{pizza.description}</p>
    </div>
  );
}