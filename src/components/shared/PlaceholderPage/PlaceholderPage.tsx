// src/components/shared/PlaceholderPage/PlaceholderPage.tsx
// Shared shell for routes that are linked from navigation but not built yet
// (About, Contact, Favorites, Cart, Profile). Keeps every "coming soon"
// screen visually consistent with the rest of PizzHub instead of each
// route inventing its own empty state.

import Link from "next/link";
import styles from "./PlaceholderPage.module.css";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <Link href="/menu" className={styles.link}>
        Browse the Menu →
      </Link>
    </div>
  );
}