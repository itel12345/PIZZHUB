// src/components/menu/MenuHero/MenuHero.tsx
// Small editorial header for the Menu page. Deliberately restrained —
// no oversized imagery, this is a working page, not a landing moment.

import styles from "./MenuHero.module.css";

export default function MenuHero() {
  return (
    <header className={styles.hero}>
      <span className={styles.eyebrow} aria-hidden="true">
        The Menu
      </span>
      <h1 className={styles.heading}>Crafted fresh, every day.</h1>
      <p className={styles.paragraph}>
        Forty-eight-hour dough, wood-fired at 430°C, and ingredients chosen
        the same way a chef would choose them — one pizza at a time.
      </p>
    </header>
  );
}
