// src/components/about/components/IngredientsSection.tsx
//
// Section 5 — Ingredient showcase, rendered from INGREDIENTS config.

import { INGREDIENTS } from "../data/aboutData";
import styles from "./IngredientsSection.module.css";

export default function IngredientsSection() {
  return (
    <section className={styles.section} aria-labelledby="ingredients-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>What Goes In</span>
          <h2 id="ingredients-heading" className={styles.heading}>
            Ingredients We Never Compromise On
          </h2>
        </div>

        <ul className={styles.grid}>
          {INGREDIENTS.map((ingredient) => (
            <li key={ingredient.title} className={styles.card}>
              <div className={styles.cardAccent} aria-hidden="true" />
              <h3 className={styles.cardTitle}>{ingredient.title}</h3>
              <p className={styles.cardDescription}>{ingredient.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}