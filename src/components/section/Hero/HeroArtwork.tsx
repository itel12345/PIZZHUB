import Image from "next/image";
import styles from "./Hero.module.css";

export default function HeroArtwork() {
  return (
    <div className={styles.artwork}>
      <div className={styles.stage}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.ringOuter} aria-hidden="true" />
        <div className={styles.ringInner} aria-hidden="true" />

        <div className={styles.image}>
          <Image
            src="/img/img_1-removebg-preview.png"
            alt="Freshly baked PizzHub pepperoni pizza with melted cheese"
            fill
            sizes="(max-width: 768px) 50vw, 336px"
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
      </div>
    </div>
  );
}
