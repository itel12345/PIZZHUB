// src/components/admin/analytics/page/AnalyticsPage.tsx

import type { AdminAnalyticsData } from "@/lib/analytics";
import StatCard from "../components/StatCard";
import RevenueChart from "../components/RevenueChart";
import TopPizzasTable from "../components/TopPizzasTable";
import PaymentMethodBreakdown from "../components/PaymentMethodBreakdown";
import styles from "./AnalyticsPage.module.css";

interface AnalyticsPageProps {
  data: AdminAnalyticsData;
}

export default function AnalyticsPage({ data }: AnalyticsPageProps) {
  const {
    confirmedRevenue,
    totalOrders,
    confirmedOrders,
    pendingOrders,
    cancelledOrders,
    totalCustomers,
    revenueOverTime,
    topPizzas,
    paymentMethodBreakdown,
  } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>
            Overview of confirmed sales, orders, and customers
          </p>
        </div>
      </div>

      <div className={styles.statGrid}>
        <StatCard
          label="Confirmed revenue"
          value={`GHS ${confirmedRevenue.toFixed(2)}`}
          accent
        />
        <StatCard label="Total orders" value={String(totalOrders)} />
        <StatCard label="Confirmed" value={String(confirmedOrders)} />
        <StatCard label="Pending" value={String(pendingOrders)} />
        <StatCard label="Cancelled" value={String(cancelledOrders)} />
        <StatCard label="Total customers" value={String(totalCustomers)} />
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Revenue over time</h2>
        <RevenueChart data={revenueOverTime} />
      </section>

      <div className={styles.splitRow}>
        <TopPizzasTable pizzas={topPizzas} />
        <PaymentMethodBreakdown breakdown={paymentMethodBreakdown} />
      </div>
    </div>
  );
}