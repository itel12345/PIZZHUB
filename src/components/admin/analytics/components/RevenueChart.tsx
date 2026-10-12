// src/components/admin/analytics/components/RevenueChart.tsx
//
// Hand-rolled SVG bars rather than a charting dependency — per this
// task's "no chart library" constraint, and consistent with this
// project's existing "avoid unnecessary third-party libraries"
// discipline. viewBox-based sizing means the SVG scales responsively
// via CSS (width: 100%) without any JS resize handling.

import type { RevenueTimeSeriesPoint } from "@/lib/analytics";
import styles from "./RevenueChart.module.css";

interface RevenueChartProps {
  data: RevenueTimeSeriesPoint[];
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 220;
const PADDING_X = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.empty}>
          <p>No confirmed sales yet — revenue will appear here once orders are confirmed.</p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((point) => point.revenue));
  const plotWidth = CHART_WIDTH - PADDING_X * 2;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const slotWidth = plotWidth / data.length;
  // Capped so a single day of data doesn't render one giant slab —
  // slotWidth alone would be the full plot width in that case.
  const barWidth = Math.min(48, slotWidth * 0.6);
  // Thin out x-axis labels once there are more than ~10 days, so dates
  // don't overlap into an unreadable smear.
  const labelStep = Math.max(1, Math.ceil(data.length / 10));

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Confirmed revenue by day"
      >
        {data.map((point, index) => {
          // maxRevenue > 0 is guaranteed here (data.length > 0 and
          // revenue is never negative), but guarded anyway rather than
          // assuming — a 0-revenue confirmed order is a real, valid
          // state (e.g. a fully-comped order) and must not divide by 0.
          const barHeight = maxRevenue > 0 ? (point.revenue / maxRevenue) * plotHeight : 0;
          const slotCenter = PADDING_X + slotWidth * index + slotWidth / 2;
          const x = slotCenter - barWidth / 2;
          const y = PADDING_TOP + plotHeight - barHeight;

          return (
            <g key={point.date}>
              <title>
                {formatShortDate(point.date)}: GHS {point.revenue.toFixed(2)} ·{" "}
                {point.orderCount} {point.orderCount === 1 ? "order" : "orders"}
              </title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={3}
                className={styles.bar}
              />
              {index % labelStep === 0 ? (
                <text
                  x={slotCenter}
                  y={CHART_HEIGHT - 8}
                  textAnchor="middle"
                  className={styles.axisLabel}
                >
                  {formatShortDate(point.date)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}