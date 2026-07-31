import styles from "./Navbar.module.css";

/**
 * NavbarLoginButton
 *
 * Secondary action button that opens AuthenticationModal on the Login
 * screen. No longer a route link — login now happens entirely inside
 * the modal, no page navigation. Same quiet glass styling as before,
 * so it stays visually subordinate to the primary "Order Now" CTA.
 */
interface NavbarLoginButtonProps {
  onClick: () => void;
}

export default function NavbarLoginButton({ onClick }: NavbarLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.navButton} ${styles.loginButton}`}
    >
      Log In
    </button>
  );
}