// src/components/about/components/AboutCTA.tsx
//
// Section 9 — Closing CTA. Large primary action into the menu, a
// secondary action into Contact. Purely presentational, fixed copy.

import Link from "next/link";
import styles from "./AboutCTA.module.css";

export default function AboutCTA() {
  return (
    <section className={styles.section}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.container}>
        <h2 className={styles.heading}>Ready to Taste the Difference?</h2>
        <p className={styles.subhead}>
          One bite, and you&apos;ll understand why we never cut corners.
        </p>

        <div className={styles.actions}>
          <Link href="/menu" className={styles.primaryButton}>
            Browse Menu
          </Link>
          <Link href="/contact" className={styles.secondaryButton}>
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}