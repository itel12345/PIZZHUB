// src/components/pizza-details/Nutrition/Nutrition.tsx
//
// Clean nutrition grid. No backend yet — values are placeholders derived
// deterministically from the pizza's id so different pizzas don't all show
// identical numbers. Swap `getPlaceholderNutrition` for a real field on
// the Pizza model (via Prisma) once nutrition data exists.

import styles from "./Nutrition.module.css";

interface NutritionProps {
  pizzaId: string;
}

interface NutritionFact {
  label: string;
  value: string;
}

function getPlaceholderNutrition(pizzaId: string): NutritionFact[] {
  // Simple deterministic hash so numbers vary per pizza but stay stable
  // across renders — purely cosmetic until real data exists.
  const seed = pizzaId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return [
    { label: "Calories", value: `${640 + (seed % 5) * 30} kcal` },
    { label: "Protein", value: `${22 + (seed % 6)} g` },
    { label: "Carbohydrates", value: `${68 + (seed % 8) * 2} g` },
    { label: "Fat", value: `${18 + (seed % 5)} g` },
  ];
}

export default function Nutrition({ pizzaId }: NutritionProps) {
  const facts = getPlaceholderNutrition(pizzaId);

  return (
    <section className={styles.section} aria-labelledby="nutrition-heading">
      <h2 id="nutrition-heading" className={styles.heading}>
        Nutrition
      </h2>
      <p className={styles.disclaimer}>Estimated per pizza. Placeholder values for now.</p>
      <dl className={styles.grid}>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.cell}>
            <dt className={styles.label}>{fact.label}</dt>
            <dd className={styles.value}>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}