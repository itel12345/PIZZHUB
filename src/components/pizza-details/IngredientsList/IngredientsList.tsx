// src/components/pizza-details/IngredientsList/IngredientsList.tsx
//
// Displays a pizza's ingredients (reused from pizzas.ts — never duplicated)
// as a row of elegant chips.

import styles from "./IngredientsList.module.css";

interface IngredientsListProps {
  ingredients: string[];
}

export default function IngredientsList({ ingredients }: IngredientsListProps) {
  return (
    <section className={styles.section} aria-labelledby="ingredients-heading">
      <h2 id="ingredients-heading" className={styles.heading}>
        Ingredients
      </h2>
      <ul className={styles.chips}>
        {ingredients.map((ingredient) => (
          <li key={ingredient} className={styles.chip}>
            {ingredient}
          </li>
        ))}
      </ul>
    </section>
  );
}