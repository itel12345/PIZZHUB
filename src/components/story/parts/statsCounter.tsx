"use client";

import styles from "./StatsCounter.module.css";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useCountUp } from "../hooks/useCountUp";
import { STATS, type StatItem } from "../data/stats";

/**
 * Formats a numeric stat for display with comma thousand-separators
 * (e.g. 25483 -> "25,483"). Ratings pass their own decimals through
 * separately in StatCard, so this is only used for whole-number stats.
 */
function formatStatValue(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Single statistic. Isolated as its own component (rather than
 * inlined in the map below) so each stat owns its own useCountUp
 * instance — counters must animate independently.
 */
function StatCard({
  stat,
  index,
  start,
}: {
  stat: StatItem;
  index: number;
  start: boolean;
}) {
  const count = useCountUp({
    end: stat.value,
    start,
    duration: 1800,
    decimals: stat.decimals ?? 0,
  });

  return (
    <div
      className={styles.stat}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {stat.isRating ? (
        <p
          className={styles.number}
          aria-label={`Rating: ${count.toFixed(stat.decimals ?? 1)} out of 5 stars`}
        >
          <span className={styles.stars} aria-hidden="true">
            ★★★★★
          </span>
          <span className={styles.ratingValue}>
            {count.toFixed(stat.decimals ?? 1)}
          </span>
        </p>
      ) : (
        <p className={styles.number}>{formatStatValue(count)}</p>
      )}

      <h3 className={styles.label}>{stat.label}</h3>
    </div>
  );
}

/**
 * StatsCounter — Part 5 of the Story Experience.
 *
 * A wide, centered "keynote slide" style scene: eyebrow label, huge
 * heading, short philosophy paragraph, then one clean horizontal row
 * of statistics — numbers only, no cards, no glass, no borders.
 * Numbers count up once when the section enters the viewport. The
 * final stat renders as a 5-star rating instead of a plain number.
 */
export function StatsCounter() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${styles.wrapper} ${isVisible ? styles.visible : ""}`}
    >
      <div className={styles.eyebrowRow}>
        <span className={styles.accentLine} aria-hidden="true" />
        <span className={styles.eyebrow}>Our Numbers</span>
      </div>

      <p className={styles.paragraph}>
        Every number below reflects a promise we keep every single
        day — to source honestly, prepare patiently, and serve
        something worth coming back for.
      </p>

      <div className={styles.row}>
        {STATS.map((stat, index) => (
          <StatCard
            key={stat.label}
            stat={stat}
            index={index}
            start={isVisible}
          />
        ))}
      </div>
    </div>
  );
}
