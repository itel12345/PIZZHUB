// src/components/admin/analytics/components/PaymentMethodBreakdown.tsx

import type { PaymentMethodStat } from "@/lib/analytics";
import type { PaymentMethod } from "@/generated/prisma/client";
import styles from "./PaymentMethodBreakdown.module.css";

interface PaymentMethodBreakdownProps {
  breakdown: PaymentMethodStat[];
}

const LABELS: Record<PaymentMethod, string> = {
  COD: "Cash on Delivery",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Card",
};

export default function PaymentMethodBreakdown({ breakdown }: PaymentMethodBreakdownProps) {
  const totalOrders = breakdown.reduce((sum, item) => sum + item.orderCount, 0);

  return (
    <div className={styles.wrap}>
      <h3 className={styles.heading}>Payment methods</h3>

      {totalOrders === 0 ? (
        <div className={styles.empty}>
          <p>No confirmed orders yet.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {breakdown.map((item) => {
            const percentage = (item.orderCount / totalOrders) * 100;
            return (
              <li key={item.method} className={styles.row}>
                <div className={styles.rowHeader}>
                  <span className={styles.methodLabel}>{LABELS[item.method]}</span>
                  <span className={styles.methodValue}>
                    {item.orderCount} {item.orderCount === 1 ? "order" : "orders"} · GHS{" "}
                    {item.revenue.toFixed(2)}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${percentage}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}