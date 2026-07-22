// src/components/menu/PizzaGrid/PizzaGrid.tsx
// Responsive card grid: 1 col mobile, 2 col tablet, 3–4 col desktop.
// Renders an editorial empty state when a search/filter combination matches nothing.

import type { Pizza } from "../data/pizzas";
import PizzaCard from "../PizzaCard/PizzaCard";
import styles from "./PizzaGrid.module.css";

interface PizzaGridProps {
  pizzas: Pizza[];
}

export default function PizzaGrid({ pizzas }: PizzaGridProps) {
  if (pizzas.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No pizzas match that search.</p>
        <p className={styles.emptyHint}>
          Try a different ingredient, or clear the category filter.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {pizzas.map((pizza, index) => (
        <PizzaCard key={pizza.id} pizza={pizza} index={index} />
      ))}
    </div>
  );
}
