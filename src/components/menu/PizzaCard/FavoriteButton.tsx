// src/components/menu/PizzaCard/FavoriteButton.tsx
// Standalone heart-toggle button, reused by PizzaCard, PizzaActions (pizza
// details page), and anywhere else a favorite toggle is needed. Backed by
// the global useFavorites() context (src/components/favorites) via the
// isFavorite/onToggle props passed in by each caller — this component
// itself doesn't know or care where the data comes from.

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
        // stopPropagation alone should already prevent the ancestor
        // <Link>'s navigation from firing (the click event never
        // bubbles to reach it) — preventDefault is added as a second,
        // independent guard against the browser's native "follow this
        // anchor" behavior specifically, in case anything about how
        // Next.js's Link registers its click handling isn't purely
        // bubble-dependent. Costs nothing, closes the gap either way.
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remove ${pizzaName} from favorites` : `Add ${pizzaName} to favorites`}
    >
      <svg
        // Keying by isFavorite forces React to remount the <svg> on every
        // toggle (in both directions), so the bounce keyframe in
        // FavoriteButton.module.css restarts fresh each click instead of
        // only playing once.
        key={isFavorite ? "favorited" : "unfavorited"}
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