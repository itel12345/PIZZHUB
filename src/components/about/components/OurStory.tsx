// src/components/about/components/OurStory.tsx
//
// Section 2 — Two-column editorial layout. Left column carries the
// narrative copy, right column is a supporting visual panel (glass
// card, not a photo — keeps this page dependency-free and consistent
// with the rest of the site's placeholder-safe conventions).

import styles from "./OurStory.module.css";

export default function OurStory() {
  return (
    <section className={styles.section} aria-labelledby="our-story-heading">
      <div className={styles.container}>
        <div className={styles.textColumn}>
          <span className={styles.eyebrow}>Our Story</span>
          <h2 id="our-story-heading" className={styles.heading}>
            Started in a small kitchen. Built on a big idea.
          </h2>
          <p className={styles.paragraph}>
            PizzHub didn&apos;t start as a delivery app. It started as a single
            oven, a handful of recipes, and a stubborn refusal to cut corners.
            What began as pizza for the neighborhood slowly became something
            people planned their evenings around.
          </p>
          <p className={styles.paragraph}>
            Today, that same philosophy drives everything we do — from the
            suppliers we choose to the drivers who bring your order to the
            door. We didn&apos;t scale by changing the recipe. We scaled by
            protecting it.
          </p>
        </div>

        <div className={styles.visualColumn} aria-hidden="true">
          <div className={styles.visualCard}>
            <span className={styles.visualEyebrow}>Since Day One</span>
            <span className={styles.visualStat}>100%</span>
            <span className={styles.visualLabel}>Fresh, never frozen</span>
          </div>
        </div>
      </div>
    </section>
  );
}