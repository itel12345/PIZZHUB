import styles from "./Hero.module.css";

/**
 * HeroBadge
 *
 * Small eyebrow label above the headline, signaling current
 * delivery coverage. Styled as a premium glass pill, matching
 * the Navbar's visual language.
 */
export default function HeroBadge() {
  return (
    <span className={`${styles.badge} ${styles.pill} ${styles.glassFill} ${styles.glassBorder} ${styles.blurEffect}`}>
      Fast 30-Minutes Delivery 
    </span>
  );
}
