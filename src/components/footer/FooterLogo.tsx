import styles from "./Footer.module.css";

/**
 * FooterLogo
 *
 * Lightweight wordmark for the footer — not a full reproduction of
 * the Navbar's logo component (that one wasn't accessible from this
 * scope), styled to match the same brand accent instead: white
 * "Pizz" + orange "Hub". A soft, very subtle glow sits behind it.
 *
 * If the project has a shared NavbarLogo component that should be
 * reused here instead, swap this file's contents for that import.
 */
export function FooterLogo() {
  return (
    <div className={styles.logoWrapper}>
      <div className={styles.logoGlow} aria-hidden="true" />
      <span className={styles.logo}>
        Pizz<span className={styles.logoAccent}>Hub</span>
      </span>
    </div>
  );
}
