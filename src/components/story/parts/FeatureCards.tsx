"use client";

import styles from "./FeatureCards.module.css";
import { useScrollReveal } from "../hooks/useScrollReveal";

interface FeatureCardData {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURES: FeatureCardData[] = [
  {
    title: "Fresh Ingredients",
    description:
      "Sourced daily from local growers — nothing frozen, nothing processed.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3c-2 3-2 6 0 9s2 6 0 9M6 12c0-3 2.5-5 6-5M18 12c0-3-2.5-5-6-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Fast Delivery",
    description:
      "Hot, fresh, and at your door in 25 minutes or less, on average.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 16V7a1 1 0 0 1 1-1h9v10M4 16h10M4 16H2M14 16h4l3-4v-3h-7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7.5" cy="18.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17.5" cy="18.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Italian Recipes",
    description:
      "Traditional methods passed down through generations of pizzaiolos.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Wood Fired",
    description:
      "Baked in a real wood-fired oven for that signature smoky char.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c1 2 2 3 2 5a4 4 0 1 1-8 0c0-4 3-5 4-12Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/**
 * FeatureCards — Part 3 of the Story Experience.
 *
 * Four floating glass cards (icon, title, description) that reveal
 * with a staggered fade-up and idle-float once visible, and lift with
 * a warming glow on hover — same interaction language as the Hero
 * artwork's hover backlight.
 */
export function FeatureCards() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div ref={ref} className={styles.grid}>
      {FEATURES.map((feature, index) => (
        <div
          key={feature.title}
          className={`${styles.card} ${isVisible ? styles.visible : ""}`}
          style={{
            transitionDelay: `${index * 120}ms`,
            animationDelay: `${index * 0.6}s`,
          }}
        >
          <div className={styles.cardGlow} aria-hidden="true" />
          <div className={styles.icon}>{feature.icon}</div>
          <h3 className={styles.cardTitle}>{feature.title}</h3>
          <p className={styles.cardDescription}>{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
