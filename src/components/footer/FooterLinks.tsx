import Link from "next/link";
import styles from "./Footer.module.css";

interface FooterLinksProps {
  /** Set true once the footer has scrolled into view, to trigger the stagger. */
  isVisible: boolean;
}

const NAV_LINKS = [
  { label: "Menu", href: "/menu" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/**
 * FooterLinks
 *
 * "Navigation" column. Each link grows a thin orange underline from
 * left to right on hover (GPU-friendly transform: scaleX, not a
 * width transition). Items stagger in via nth-child transition-delay
 * once `isVisible` is true — no per-item JS state needed.
 */
export function FooterLinks({ isVisible }: FooterLinksProps) {
  return (
    <nav
      aria-label="Footer navigation"
      className={`${styles.column} ${isVisible ? styles.visible : ""}`}
    >
      <h3 className={styles.columnHeading}>Navigation</h3>
      <ul className={styles.linkList}>
        {NAV_LINKS.map((link) => (
          <li key={link.href} className={styles.linkItem}>
            <Link href={link.href} className={styles.link}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
