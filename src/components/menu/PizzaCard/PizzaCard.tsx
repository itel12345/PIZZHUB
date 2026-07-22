// src/components/menu/PizzaCard/PizzaCard.tsx
// Individual pizza card. Quantity + "Add to cart" are local UI state only —
// there is no cart/backend wired up yet (out of scope per the design brief).

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Pizza } from "../data/pizzas";
import FavoriteButton from "./FavoriteButton";
import styles from "./PizzaCard.module.css";

interface PizzaCardProps {
  pizza: Pizza;
  index: number;
}

export default function PizzaCard({ pizza, index }: PizzaCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  // Local-only for now — see FavoriteButton.tsx for the planned upgrade path
  // to a real User → Favorites relation.
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className={styles.card}>
      <Link
        href={`/menu/${pizza.id}`}
        className={styles.cardLink}
        aria-label={`View details for ${pizza.name}`}
      >
        <div className={styles.imageWrapper}>
          <Image
            src={pizza.image}
            alt={pizza.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={styles.image}
          />
          {pizza.isPremium && <span className={styles.badge}>Chef&apos;s Selection</span>}
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={() => setIsFavorite((v) => !v)}
            pizzaName={pizza.name}
          />
        </div>

        <div className={styles.info}>
          <span className={styles.number} aria-hidden="true">
            No. {String(index + 1).padStart(2, "0")}
          </span>

          <h3 className={styles.name}>{pizza.name}</h3>
          <p className={styles.description}>{pizza.description}</p>

          <ul className={styles.ingredients} aria-label="Key ingredients">
            {pizza.ingredients.map((ingredient, i) => (
              <li key={ingredient} className={styles.ingredient}>
                {ingredient}
                {i < pizza.ingredients.length - 1 && (
                  <span className={styles.dot} aria-hidden="true">
                    ·
                  </span>
                )}
              </li>
            ))}
          </ul>

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
        </div>
      </Link>

      <div className={styles.actionsWrapper}>
        <div className={styles.actions}>
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepperButton}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label={`Decrease quantity of ${pizza.name}`}
            >
              −
            </button>
            <span className={styles.quantity} aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              className={styles.stepperButton}
              onClick={() => setQuantity((q) => Math.min(9, q + 1))}
              aria-label={`Increase quantity of ${pizza.name}`}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className={`${styles.addButton} ${added ? styles.addButtonActive : ""}`}
            onClick={handleAdd}
          >
            {added ? "Added" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}