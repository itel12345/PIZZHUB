import styles from "./Navbar.module.css";

interface MobileMenuButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * MobileMenuButton
 *
 * Hamburger trigger for the mobile nav panel. Controlled by
 * its parent (Navbar) via props — this component holds no
 * state of its own, it only renders the button and reports
 * clicks upward.
 *
 * Real <button> element, so it's keyboard-focusable and
 * activatable with Enter/Space by default. aria-expanded and
 * aria-controls keep assistive tech in sync with the panel's
 * actual open/closed state.
 */
export default function MobileMenuButton({ isOpen, onToggle }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      className={styles.menuButton}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls="mobile-nav-panel"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <span className={styles.menuIconBar} />
      <span className={styles.menuIconBar} />
      <span className={styles.menuIconBar} />
    </button>
  );
}
