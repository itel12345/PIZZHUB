import styles from "./Navbar.module.css";

/**
 * NavbarSignupButton
 *
 * Secondary action button that opens AuthenticationModal on the Signup
 * screen. No longer a route link — signup now happens entirely inside
 * the modal, no page navigation. Same quiet glass styling as before,
 * so it stays visually subordinate to the primary "Order Now" CTA.
 */
interface NavbarSignupButtonProps {
  onClick: () => void;
}

export default function NavbarSignupButton({ onClick }: NavbarSignupButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.navButton} ${styles.SignupButton}`}
    >
      Sign up
    </button>
  );
}