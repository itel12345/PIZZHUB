// src/components/layout/NavActions/FavoritesButton.tsx
import Link from "next/link";
import styles from "./NavActions.module.css";

interface FavoritesButtonProps {
  count: number;
}

export default function FavoritesButton({ count }: FavoritesButtonProps) {
  return (
    <Link
      href="/favorites"
      className={styles.iconButton}
      aria-label={`Favorites, ${count} saved`}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.icon}>
        <path
          d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4 5.6 4c2 0 3.4 1 4.4 2.5C11 5 12.4 4 14.4 4 18 4 19.6 7.8 22 11.2c-2.5 4.7-10 9.3-10 9.3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span key={count} className={styles.badge}>
          {count}
        </span>
      )}
    </Link>
  );
}