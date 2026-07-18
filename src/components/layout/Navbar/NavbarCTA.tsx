import Link from "next/link";
import styles from "./Navbar.module.css";

/**
 * NavbarCTA
 *
 * Primary call-to-action in the navbar, driving users toward
 * the ordering flow. Styled as a solid accent pill to stand
 * out clearly against the glass background.
 */
export default function NavbarCTA() {
  return (
    <Link href="/order" className={`${styles.navButton} ${styles.cta}`}>
      Order Now
    </Link>
  );
}
