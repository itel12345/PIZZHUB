import styles from "./Hero.module.css";
import HeroContent from "./HeroContent";
import HeroArtwork from "./HeroArtwork";

export default function Hero() {
  return (
    <section aria-labelledby="hero-heading" className={styles.hero}>
      <HeroContent />
      <HeroArtwork />
    </section>
  );
}
