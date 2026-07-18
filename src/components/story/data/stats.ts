/**
 * stats.ts
 *
 * Data source for the Signature Statistics section (Part 5).
 * Kept separate from the component so content can be edited without
 * touching any component or animation logic.
 */

export interface StatItem {
  /** Raw numeric value the counter animates up to. */
  value: number;
  /** Short label shown under the number. */
  label: string;
  /** Decimal places to preserve during count-up and final display. Defaults to 0 (whole numbers). */
  decimals?: number;
  /** Renders as a 5-star rating (stars in orange, value in white) instead of a plain number. */
  isRating?: boolean;
}

export const STATS: StatItem[] = [
  {
    value: 25483,
    label: "Registered Users",
  },
  {
    value: 18294,
    label: "Orders",
  },
  {
    value: 17921,
    label: "Completed Orders",
  },
  {
    value: 4.9,
    label: "Rating",
    decimals: 1,
    isRating: true,
  },
];
