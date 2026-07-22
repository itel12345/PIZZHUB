// src/components/menu/LoadMore/LoadMore.tsx
// Subtle "load more" affordance instead of numbered pagination — keeps the
// scroll-and-browse feel of the rest of the page.

import styles from "./LoadMore.module.css";

interface LoadMoreProps {
  onClick: () => void;
  remaining: number;
}

export default function LoadMore({ onClick, remaining }: LoadMoreProps) {
  if (remaining <= 0) return null;

  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.button} onClick={onClick}>
        Show More Pizzas
      </button>
      <p className={styles.hint}>{remaining} more to explore</p>
    </div>
  );
}
