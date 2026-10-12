// src/components/admin/analytics/components/StatCard.tsx

import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: string;
  /** Highlights this card with the brand accent — reserved for the one
   * headline figure (confirmed revenue) so it doesn't compete with
   * five other equally-orange cards. */
  accent?: boolean;
}

export default function StatCard({ label, value, accent = false }: StatCardProps) {
  return (
    <div className={`${styles.card} ${accent ? styles.accent : ""}`}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  );
}