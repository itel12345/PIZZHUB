// src/components/about/page/AboutPage.tsx
//
// Composes all nine About page sections in order. Section 8
// (Statistics) has no dedicated component file in the requested folder
// structure, so it's rendered directly here — small, self-contained,
// styled via AboutPage.module.css.

import AboutHero from "../components/AboutHero";
import OurStory from "../components/OurStory";
import OurValues from "../components/OurValues";
import WhyChooseUs from "../components/WhyChooseUs";
import IngredientsSection from "../components/IngredientsSection";
import PizzaJourney from "../components/PizzaJourney";
import TeamSection from "../components/TeamSection";
import AboutCTA from "../components/AboutCTA";
import { STATISTICS } from "../data/aboutData";
import styles from "./AboutPage.module.css";

export function AboutPage() {
  return (
    <div className={styles.page}>
      <AboutHero />
      <OurStory />
      <OurValues />
      <WhyChooseUs />
      <IngredientsSection />
      <PizzaJourney />
      <TeamSection />

      {/* SECTION 8 — Statistics */}
      <section className={styles.stats} aria-label="PizzHub in numbers">
        <ul className={styles.statsGrid}>
          {STATISTICS.map((stat) => (
            <li key={stat.label} className={styles.statCard}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <AboutCTA />
    </div>
  );
}