// src/components/about/components/WhyChooseUs.tsx
//
// Section 4 — Large editorial feature list with an alternating
// left/right layout, driven by WHY_CHOOSE_FEATURES. The index parity
// (even/odd) decides the visual side via a CSS class, so adding a 5th
// feature later just continues the alternation automatically.

import { WHY_CHOOSE_FEATURES } from "../data/aboutData";
import styles from "./WhyChooseUs.module.css";

export default function WhyChooseUs() {
  return (
    <section className={styles.section} aria-labelledby="why-choose-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>The PizzHub Difference</span>
          <h2 id="why-choose-heading" className={styles.heading}>
            Why Choose PizzHub
          </h2>
        </div>

        <div className={styles.list}>
          {WHY_CHOOSE_FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`${styles.row} ${
                index % 2 === 1 ? styles.rowReversed : ""
              }`}
            >
              <div className={styles.number} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className={styles.content}>
                <h3 className={styles.rowTitle}>{feature.title}</h3>
                <p className={styles.rowDescription}>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}