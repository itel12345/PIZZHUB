// src/components/pizza-details/RelatedPizzas/RelatedPizzas.tsx

import PizzaCard from "@/components/menu/PizzaCard/PizzaCard";
import type { Pizza } from "@/components/menu/hooks/useMenuFilters";
import styles from "./RelatedPizzas.module.css";

interface RelatedPizzasProps {
  currentPizza: Pizza;
  pizzas: Pizza[];
}

const RELATED_COUNT = 4;

export default function RelatedPizzas({
  currentPizza,
  pizzas,
}: RelatedPizzasProps) {
  const related = pizzas
    .filter((pizza) => pizza.id !== currentPizza.id)
    .sort((a, b) => {
      if (
        a.category === currentPizza.category &&
        b.category !== currentPizza.category
      ) {
        return -1;
      }

      if (
        a.category !== currentPizza.category &&
        b.category === currentPizza.category
      ) {
        return 1;
      }

      return 0;
    })
    .slice(0, RELATED_COUNT);

  if (related.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="related-heading"
    >
      <h2
        id="related-heading"
        className={styles.heading}
      >
        You Might Also Like
      </h2>

      <div className={styles.grid}>
        {related.map((pizza, index) => (
          <PizzaCard
            key={pizza.id}
            pizza={pizza}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}