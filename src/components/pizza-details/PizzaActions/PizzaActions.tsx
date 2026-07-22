// src/components/pizza-details/PizzaActions/PizzaActions.tsx
//
// Ordering controls for the details page. Reuses the same FavoriteButton
// component PizzaCard uses (no duplicated favorite logic) and mirrors the
// same stepper + Add to Cart pattern, just laid out for a wider page.
// Local UI state only — no cart/favorites persistence yet, per scope.

"use client";

import { useState } from "react";
import FavoriteButton from "@/components/menu/PizzaCard/FavoriteButton";
import styles from "./PizzaActions.module.css";

interface PizzaActionsProps {
  pizzaName: string;
}

export default function PizzaActions({ pizzaName }: PizzaActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className={styles.actions}>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepperButton}
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label={`Decrease quantity of ${pizzaName}`}
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
          aria-label={`Increase quantity of ${pizzaName}`}
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

      <div className={styles.favoriteSlot}>
        <FavoriteButton
          isFavorite={isFavorite}
          onToggle={() => setIsFavorite((v) => !v)}
          pizzaName={pizzaName}
        />
      </div>
    </div>
  );
}