import Link from "next/link";
import styles from "./Navbar.module.css";

/**
 * NavbarLogo
 *
 * Renders the PizzHub wordmark as a link back to the homepage.
 * The accent-colored "Hub" segment ties the logo into the
 * brand's accent palette without introducing a separate token.
 */
export default function NavbarLogo() {
  return (
    <Link href="/" className={styles.logo}>
      Pizza<span className={styles.logoAccent}>Hub</span>
    </Link>
  );
}
