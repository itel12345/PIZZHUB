import styles from "./Hero.module.css";

/**
 * HeroHeadline
 *
 * The Hero's main heading — also the page's <h1>. Uses
 * PizzHub's primary slogan directly. Carries a stable id so
 * the parent Hero <section> can reference it via
 * aria-labelledby instead of a separate, easily-outdated
 * aria-label string.
 */
export default function HeroHeadline() {
  return (
    <h1 id="hero-heading" className={styles.headline}>
      Fresh & Delicious Pizza Delivered Across Ghana.
    </h1>
  );
}
