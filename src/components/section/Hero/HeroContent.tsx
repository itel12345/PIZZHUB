import Link from "next/link";
import styles from "./Hero.module.css";

export default function HeroContent() {
  return (
    <div className={styles.content}>
      <span className={`${styles.badge} ${styles.pill} ${styles.glassFill} ${styles.glassBorder} ${styles.blurEffect}`}>
        Now Delivering Across Accra &amp; Beyond
      </span>

      <h1 id="hero-heading" className={styles.headline}>
        Fresh &amp; Delicious Pizza Delivered Across Ghana.
      </h1>

      <p className={styles.description}>
        Handcrafted pizzas made with quality ingredients, baked fresh, and
        delivered fast to your door — wherever you are in Ghana.
      </p>

      <div className={styles.actions}>
        <Link href="/order" className={`${styles.button} ${styles.pill} ${styles.buttonPrimary}`}>
          Order Now
        </Link>
        <Link
          href="/menu"
          className={`${styles.button} ${styles.pill} ${styles.buttonSecondary} ${styles.glassBorder} ${styles.blurEffect}`}
        >
          View Menu
        </Link>
      </div>
    </div>
  );
}
