// src/components/menu/PizzaCard/FavoriteButton.tsx
// Standalone heart-toggle button. Kept separate from PizzaCard so the same
// control can be reused later on /favorites, or swapped to read/write a
// real Favorites table without touching the card layout.
//
// Future integration: replace the `isFavorite`/`onToggle` props with a
// hook like `useFavorite(pizzaId)` that reads/writes through the User →
// Favorites relation once auth + database are in place. The click handler
// below is already isolated (stopPropagation'd) so that swap is a one-line change.

"use client";

import styles from "./FavoriteButton.module.css";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  pizzaName: string;
}

export default function FavoriteButton({ isFavorite, onToggle, pizzaName }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${isFavorite ? styles.buttonActive : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remove ${pizzaName} from favorites` : `Add ${pizzaName} to favorites`}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        aria-hidden="true"
      >
        <path
          d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4 5.6 4c2 0 3.4 1 4.4 2.5C11 5 12.4 4 14.4 4 18 4 19.6 7.8 22 11.2c-2.5 4.7-10 9.3-10 9.3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}