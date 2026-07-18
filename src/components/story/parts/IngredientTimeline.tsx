"use client";

import styles from "./IngredientTimeline.module.css";
import { useScrollReveal } from "../hooks/useScrollReveal";

interface TimelineStep {
  label: string;
}

const STEPS: TimelineStep[] = [
  { label: "Fresh Farm" },
  { label: "Kitchen" },
  { label: "Stone Oven" },
  { label: "Delivered Fresh" },
];

/**
 * IngredientTimeline — Part 4 of the Story Experience.
 *
 * Shows the pizza's journey as a connected sequence of glowing nodes
 * along a single line. The line animates its width (scaleX) in sync
 * with each node's staggered fade-in, so it reads as "drawing itself"
 * left to right as the section reveals. Collapses to a vertical line
 * on mobile so labels never crowd each other horizontally.
 */
export function IngredientTimeline() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${styles.wrapper} ${isVisible ? styles.visible : ""}`}
    >
      <div className={styles.eyebrowRow}>
        <span className={styles.accentLine} aria-hidden="true" />
        <span className={styles.eyebrow}>The Journey</span>
      </div>

      <div className={styles.timeline}>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.progressLine} />
        </div>

        <ol className={styles.stepList}>
          {STEPS.map((step, index) => (
            <li
              key={step.label}
              className={styles.step}
              style={{ transitionDelay: `${300 + index * 200}ms` }}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.stepLabel}>{step.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
