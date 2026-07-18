"use client";

import styles from "./EditorialHeading.module.css";
import { useScrollReveal } from "../hooks/useScrollReveal";

/**
 * EditorialHeading — Part 1 of the Story Experience.
 *
 * Large-format editorial statement that opens the section: a small
 * orange accent label, a huge two-line headline, and a short
 * supporting paragraph. Reveals with a blur+fade+slide-up on scroll.
 */
export function EditorialHeading() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${styles.wrapper} ${isVisible ? styles.visible : ""}`}
    >
      <div className={styles.accentRow}>
        <span className={styles.accentLine} aria-hidden="true" />
        <span className={styles.accentLabel}>Our Story</span>
      </div>

      <h2 className={styles.heading}>
        Every Slice
        <br />
        Tells a Story
      </h2>

      <p className={styles.paragraph}>
        From the farm to the stone oven, every pizza we make carries a
        history of care — real ingredients, honest technique, and a
        respect for the craft that turns a simple meal into something
        worth remembering.
      </p>
    </div>
  );
}
