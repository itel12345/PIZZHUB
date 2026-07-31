// src/components/about/components/AboutHero.tsx
//
// Section 1 — Premium editorial hero. Large headline, short supporting
// copy, glass badge, and a CTA into the menu. Purely presentational —
// no props, since this section's content is fixed copy, not data-driven.

import Link from "next/link";
import styles from "./AboutHero.module.css";

export default function AboutHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />

      <span className={styles.badge}>Our Story</span>

      <h1 className={styles.headline}>
        Crafted with Passion.
        <br />
        Served with Purpose.
      </h1>

      <p className={styles.subhead}>
        PizzHub began with a simple belief: great pizza shouldn&apos;t require
        compromise. Every pie we send out carries that same standard, from our
        kitchen to your door.
      </p>

      <Link href="/menu" className={styles.cta}>
        Explore the Menu
      </Link>
    </section>
  );
}