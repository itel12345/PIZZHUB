// src/components/pizza-details/RelatedPizzas/RelatedPizzas.tsx
//
// Shows up to 4 related pizzas: same category first, then filled with
// other pizzas if the category has fewer than 4 items. Reuses PizzaCard
// directly — no redesign, no duplicated card markup.

import { pizzas, type Pizza } from "@/components/menu/data/pizzas";
import PizzaCard from "@/components/menu/PizzaCard/PizzaCard";
import styles from "./RelatedPizzas.module.css";

interface RelatedPizzasProps {
  currentPizza: Pizza;
}

const RELATED_COUNT = 4;

function getRelatedPizzas(currentPizza: Pizza): Pizza[] {
  const others = pizzas.filter((p) => p.id !== currentPizza.id);

  const sameCategory = others.filter((p) => p.category === currentPizza.category);
  const rest = others.filter((p) => p.category !== currentPizza.category);

  return [...sameCategory, ...rest].slice(0, RELATED_COUNT);
}

export default function RelatedPizzas({ currentPizza }: RelatedPizzasProps) {
  const related = getRelatedPizzas(currentPizza);

  if (related.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="related-heading">
      <h2 id="related-heading" className={styles.heading}>
        You Might Also Like
      </h2>
      <div className={styles.grid}>
        {related.map((pizza, index) => (
          <PizzaCard key={pizza.id} pizza={pizza} index={index} />
        ))}
      </div>
    </section>
  );
}