"use client";

import styles from "./Footer.module.css";
import { useScrollReveal } from "@/components/story/hooks/useScrollReveal";
import { FooterLogo } from "./FooterLogo";
import { FooterLinks } from "./FooterLinks";
import { FooterContact } from "./FooterContact";
import { FooterSocials } from "./FooterSocials";

/**
 * Footer
 *
 * The final section of the PizzHub homepage. Elegant black
 * background (#050505, not glass, not gray), a single hairline top
 * border, logo + tagline, a three-column info row (Navigation,
 * Contact, Follow Us), and a centered copyright line.
 *
 * Reuses the project's existing useScrollReveal hook — no new
 * reveal logic. The whole footer fades up together; the three
 * columns individually stagger their own list items in once visible
 * (handled inside each subcomponent's own CSS).
 */
export function Footer() {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <footer
      ref={ref}
      className={`${styles.footer} ${isVisible ? styles.visible : ""}`}
    >
      <div className={styles.topBlock}>
        <FooterLogo />
        <p className={styles.description}>
          Fresh artisan pizza crafted with premium ingredients and
          delivered hot every single day.
        </p>
      </div>

      <div className={styles.divider} aria-hidden="true" />

      <div className={styles.columns}>
        <FooterLinks isVisible={isVisible} />
        <FooterContact isVisible={isVisible} />
        <FooterSocials isVisible={isVisible} />
      </div>

      <div className={styles.divider} aria-hidden="true" />

      <p className={styles.copyright}>
        &copy; 2026 PizzHub.
        <br />
        Crafted with ❤️ in Ghana.
      </p>
    </footer>
  );
}
