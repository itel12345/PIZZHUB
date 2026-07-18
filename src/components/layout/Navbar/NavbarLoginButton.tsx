import Link from "next/link";
import styles from "./Navbar.module.css";

/**
 * NavbarLoginButton
 *
 * Secondary action button linking to the future login route.
 * This is a UI placeholder only — no authentication, form, or
 * backend logic is wired up here. Styled as a quiet glass
 * button so it stays visually subordinate to the primary
 * "Order Now" CTA.
 */
export default function NavbarLoginButton() {
  return (
    <Link href="/login" className={`${styles.navButton} ${styles.loginButton}`}>
      Log In
    </Link>
  );
}
