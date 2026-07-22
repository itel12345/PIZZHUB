// src/components/layout/NavActions/CartButton.tsx
import Link from "next/link";
import styles from "./NavActions.module.css";

interface CartButtonProps {
  count: number;
}

export default function CartButton({ count }: CartButtonProps) {
  return (
    <Link href="/cart" className={styles.iconButton} aria-label={`Cart, ${count} items`}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.icon}>
        <path
          d="M3 4h2l2.4 12.2a2 2 0 002 1.8h8.2a2 2 0 002-1.6L21 8H6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="20.5" r="1.4" fill="currentColor" />
        <circle cx="17.5" cy="20.5" r="1.4" fill="currentColor" />
      </svg>
      {count > 0 && (
        <span key={count} className={styles.badge}>
          {count}
        </span>
      )}
    </Link>
  );
}