import styles from "./Footer.module.css";

interface FooterSocialsProps {
  isVisible: boolean;
}

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/itel.leke",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 9h2.5V6.2C16.1 6.1 15 6 13.8 6 11.3 6 9.6 7.5 9.6 10.2V12H7v3h2.6v7h3.1v-7h2.5l.4-3h-2.9v-1.5c0-.9.3-1.5 1.3-1.5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://tiktok.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M15 3v9.5a3.5 3.5 0 1 1-3.5-3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M15 3c.5 2.2 2 3.6 4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

/**
 * FooterSocials
 *
 * "Follow Us" column. Circular glass buttons that lift and glow
 * orange on hover — same interaction language used elsewhere in the
 * Story Experience (Hero backlight, FeatureCards hover). Stagger via
 * nth-child transition-delay once `isVisible` is true.
 */
export function FooterSocials({ isVisible }: FooterSocialsProps) {
  return (
    <div className={`${styles.column} ${isVisible ? styles.visible : ""}`}>
      <h3 className={styles.columnHeading}>Follow Us</h3>
      <ul className={styles.socialList}>
        {SOCIALS.map((social) => (
          <li key={social.label} className={styles.socialItem}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className={styles.socialButton}
            >
              {social.icon}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
