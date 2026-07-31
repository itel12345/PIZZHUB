// src/components/contact/components/ContactCTA.tsx
//
// Section 5 — Closing CTA, mirroring AboutCTA.tsx's exact structure
// (glow, heading, subhead, primary + secondary button).

import Link from "next/link";
import styles from "./ContactCTA.module.css";

export default function ContactCTA() {
  return (
    <section className={styles.section}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.container}>
        <h2 className={styles.heading}>Still Have Questions?</h2>
        <p className={styles.subhead}>
          Our team is on standby every day, ready to help however we can.
        </p>

        <div className={styles.actions}>
          <Link href="/menu" className={styles.primaryButton}>
            Browse Menu
          </Link>
          <Link href="/" className={styles.secondaryButton}>
            Back Home
          </Link>
        </div>
      </div>
    </section>
  );
}