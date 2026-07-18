import styles from "./Footer.module.css";

interface FooterContactProps {
  isVisible: boolean;
}

/**
 * FooterContact
 *
 * "Contact" column. Small inline SVG icons precede each line (no
 * dependency on an external icon set, since none was confirmed
 * available for this scope) — swap for the project's icon
 * components if/when those exist under components/icons.
 */
export function FooterContact({ isVisible }: FooterContactProps) {
  return (
    <div className={`${styles.column} ${isVisible ? styles.visible : ""}`}>
      <h3 className={styles.columnHeading}>Contact</h3>
      <ul className={styles.contactList}>
        <li className={styles.contactItem}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.contactIcon}>
            <path
              d="M12 21s-6.5-5.7-6.5-11A6.5 6.5 0 0 1 12 3.5 6.5 6.5 0 0 1 18.5 10c0 5.3-6.5 11-6.5 11Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>Accra, Ghana</span>
        </li>

        <li className={styles.contactItem}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.contactIcon}>
            <path
              d="M6.5 3h3l1.5 4.5-2 1.5a11 11 0 0 0 5 5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 5a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <a href="tel:+2330508437839" className={styles.contactLink}>
            +233 050 843 7839
          </a>
        </li>

        <li className={styles.contactItem}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.contactIcon}>
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <a href="mailto:12345itelleke@gmail.com" className={styles.contactLink}>
            12345itelleke@gmail.com
          </a>
        </li>
      </ul>
    </div>
  );
}
