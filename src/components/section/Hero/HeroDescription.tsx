import styles from "./Hero.module.css";

/**
 * HeroDescription
 *
 * Supporting paragraph beneath the headline, expanding on
 * PizzHub's value proposition.
 */
export default function HeroDescription() {
  return (
    <p className={styles.description}>
      Handcrafted pizzas made with quality ingredients, baked fresh, and
      delivered fast to your door — wherever you are in Ghana.
    </p>
  );
}
