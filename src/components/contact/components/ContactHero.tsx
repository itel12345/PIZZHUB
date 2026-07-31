// src/components/contact/components/ContactHero.tsx
//
// Section 1 — Premium editorial hero, mirroring AboutHero's structure
// exactly (badge, glow, headline, subhead). No CTA button here since
// the contact form sits immediately below in the page flow.

import styles from "./ContactHero.module.css";

export default function ContactHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />

      <span className={styles.badge}>Get In Touch</span>

      <h1 className={styles.headline}>
        We&apos;d Love to
        <br />
        Hear From You.
      </h1>

      <p className={styles.subhead}>
        Questions, feedback, or a large order to plan — our team is always
        just a message away.
      </p>
    </section>
  );
}