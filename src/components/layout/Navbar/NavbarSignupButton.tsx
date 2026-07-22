import Link from "next/link";
import styles from "./Navbar.module.css";

/**
 * NavbarSigninButton
 *
 * Secondary action button linking to the future signin route.
 * This is a UI placeholder only — no authentication, form, or
 * backend logic is wired up here. Styled as a quiet glass
 * button so it stays visually subordinate to the primary
 * "Order Now" CTA.
 */
export default function NavbarSignupButton() {
  return (
    <Link href="/Register" className={`${styles.navButton} ${styles.SignupButton}`}>
      Sign up
    </Link>
  );
}
