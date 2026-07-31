// src/components/about/components/PizzaJourney.tsx
//
// Section 6 — Vertical timeline rendered from PIZZA_JOURNEY. Each step
// is a real <li> in an ordered structure (semantic, not just visual),
// connected by a CSS line rather than a canvas/SVG path — keeps this
// dependency-free and trivially editable if a step is added or removed.

import { PIZZA_JOURNEY } from "../data/aboutData";
import styles from "./PizzaJourney.module.css";

export default function PizzaJourney() {
  return (
    <section className={styles.section} aria-labelledby="journey-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>From Oven to Door</span>
          <h2 id="journey-heading" className={styles.heading}>
            The Pizza Journey
          </h2>
        </div>

        <ol className={styles.timeline}>
          {PIZZA_JOURNEY.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.marker} aria-hidden="true">
                <span className={styles.markerDot} />
              </div>
              <div className={styles.stepContent}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}