import styles from "./StoryExperience.module.css";
import  BackgroundGlow  from "@/components/effects/BackgroundGlow";
import { EditorialHeading } from "./parts/EditorialHeading";
import { FeatureCards } from "./parts/FeatureCards";
import { IngredientTimeline } from "./parts/IngredientTimeline";
import { StatsCounter } from "./parts/statsCounter";

/**
 * StoryExperience
 *
 * The premium, long-form "story" section that sits directly beneath
 * Hero. Dark shell + reused ambient background + a scene container
 * populated one Part at a time.
 *
 * Currently mounted:
 *   Part 1 — EditorialHeading
 *   Part 2 — IngredientShowcase
 *   Part 3 — FeatureCards
 *   Part 4 — IngredientTimeline
 *   Part 5 — StatsCounter
 *
 * Still to come (Parts 6–8): ChefQuote, FloatingIngredients,
 * SectionDivider.
 *
 * Server component — no interactivity lives here directly. Individual
 * Parts that need scroll-reveal or counters are client components
 * using the shared `useScrollReveal` / `useCountUp` hooks.
 */
export function StoryExperience() {
  return (
    <section
      className={styles.section}
      aria-label="The PizzHub Story"
    >
      <div className={styles.backgroundLayer} aria-hidden="true">
        <BackgroundGlow />
      </div>

      <div className={styles.container}>
        <EditorialHeading />
        <FeatureCards />
        <IngredientTimeline />
        <StatsCounter />
        {/* Parts 6–8 mount here, one at a time, in upcoming steps */}
      </div>
    </section>
  );
}
