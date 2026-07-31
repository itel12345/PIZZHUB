// src/components/about/components/OurValues.tsx
//
// Section 3 — Four value cards rendered from OUR_VALUES config array.
// Adding/removing a value later is purely a data change, no JSX edits.

import { OUR_VALUES } from "../data/aboutData";
import styles from "./OurValues.module.css";

export default function OurValues() {
  return (
    <section className={styles.section} aria-labelledby="our-values-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>What We Stand For</span>
          <h2 id="our-values-heading" className={styles.heading}>
            Our Values
          </h2>
        </div>

        <ul className={styles.grid}>
          {OUR_VALUES.map((value) => (
            <li key={value.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{value.title}</h3>
              <p className={styles.cardDescription}>{value.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}