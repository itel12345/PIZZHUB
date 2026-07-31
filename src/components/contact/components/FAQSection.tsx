// src/components/contact/components/FAQSection.tsx
//
// Section 4 — FAQ accordion. Uses native <details>/<summary> rather
// than a custom JS-driven accordion — fully keyboard accessible and
// screen-reader friendly out of the box, no state management or extra
// dependencies needed for something this simple.

import { FAQ_ITEMS } from "../data/contactData";
import styles from "./FAQSection.module.css";

export default function FAQSection() {
  return (
    <section className={styles.section} aria-labelledby="faq-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Common Questions</span>
          <h2 id="faq-heading" className={styles.heading}>
            Frequently Asked Questions
          </h2>
        </div>

        <div className={styles.list}>
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className={styles.item}>
              <summary className={styles.question}>
                {item.question}
                <span className={styles.icon} aria-hidden="true">
                  +
                </span>
              </summary>
              <p className={styles.answer}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}