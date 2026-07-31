// src/components/contact/components/ContactCards.tsx
//
// Section 2 — Four contact info cards rendered from CONTACT_INFO,
// mirroring OurValues.tsx's exact card/grid pattern.

import { CONTACT_INFO } from "../data/contactData";
import styles from "./ContactCards.module.css";

export default function ContactCards() {
  return (
    <section className={styles.section} aria-labelledby="contact-cards-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Reach Us</span>
          <h2 id="contact-cards-heading" className={styles.heading}>
            Ways to Connect
          </h2>
        </div>

        <ul className={styles.grid}>
          {CONTACT_INFO.map((card) => (
            <li key={card.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <span className={styles.cardDetail}>{card.detail}</span>
              <p className={styles.cardDescription}>{card.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}