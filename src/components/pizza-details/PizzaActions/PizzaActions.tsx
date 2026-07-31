// src/components/pizza-details/PizzaActions/PizzaActions.tsx
//
// Ordering controls for the details page. Reuses the same FavoriteButton
// component PizzaCard uses (no duplicated favorite logic) and mirrors the
// same stepper + Add to Cart pattern, just laid out for a wider page.
//
// NOTE: now requires pizzaImage + pizzaPrice in addition to the existing
// pizzaId/pizzaName props, since a real cart line needs an image and a
// price to render on the /cart page. Update the call site in
// PizzaDetailsPage.tsx to pass these two new props through from the
// pizza object it already has in scope.

"use client";

import { useState } from "react";
import FavoriteButton from "@/components/menu/PizzaCard/FavoriteButton";
import { useFavorites } from "@/components/favorites";
import { useCart } from "@/components/cart";
import styles from "./PizzaActions.module.css";

interface PizzaActionsProps {
  pizzaId: string;
  pizzaName: string;
  pizzaImage: string;
  pizzaPrice: number;
}

export default function PizzaActions({
  pizzaId,
  pizzaName,
  pizzaImage,
  pizzaPrice,
}: PizzaActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  // Same global favorites source as PizzaCard and the Navbar badge — one
  // source of truth, per the spec.
  const { isFavorite, toggleFavorite } = useFavorites();
  // Same global cart source as PizzaCard and the Navbar badge.
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(
      { pizzaId, name: pizzaName, image: pizzaImage, price: pizzaPrice },
      quantity
    );
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
          isFavorite={isFavorite(pizzaId)}
          onToggle={() => toggleFavorite(pizzaId)}
          pizzaName={pizzaName}
        />
      </div>
    </div>
  );
}