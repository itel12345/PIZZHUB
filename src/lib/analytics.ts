// src/lib/analytics.ts
//
// Same discipline as lib/customers.ts and lib/orders.ts: explicit
// Prisma `select`, DTOs computed once here rather than re-derived in
// components, and money treated as "confirmed revenue" only — a
// PENDING order that never completed, or a CANCELLED one, was never
// actually paid, so it must not count toward revenue figures. Order
// *counts* (total/confirmed/pending/cancelled) are the one place all
// statuses matter, since that's an operational view of the pipeline,
// not a revenue figure.
//
// Revenue-over-time and the payment-method breakdown are both derived
// from a single findMany() of confirmed orders rather than two
// separate queries (or a raw SQL date_trunc) — at this app's order
// volume, bucketing in JS is simpler, fully type-safe, and avoids
// $queryRaw for no real performance benefit.

import "server-only";
import { prisma } from "./prisma";
import { PaymentMethod } from "@/generated/prisma/client";

export interface RevenueTimeSeriesPoint {
  /** ISO calendar date, e.g. "2026-08-31" — one point per calendar day
   * that had at least one confirmed order. Days with no confirmed
   * orders are omitted rather than padded with zero-value points. */
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TopPizzaStat {
  pizzaId: number;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface PaymentMethodStat {
  method: PaymentMethod;
  orderCount: number;
  revenue: number;
}

export interface AdminAnalyticsData {
  confirmedRevenue: number;
  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  revenueOverTime: RevenueTimeSeriesPoint[];
  topPizzas: TopPizzaStat[];
  paymentMethodBreakdown: PaymentMethodStat[];
}

const TOP_PIZZAS_LIMIT = 5;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getAnalyticsForAdmin(): Promise<AdminAnalyticsData> {
  const [
    totalOrders,
    confirmedOrders,
    pendingOrders,
    cancelledOrders,
    totalCustomers,
    confirmedOrderRows,
    confirmedOrderItems,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.order.findMany({
      where: { status: "CONFIRMED" },
      select: { createdAt: true, total: true, paymentMethod: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: "CONFIRMED" } },
      select: { pizzaId: true, name: true, price: true, quantity: true },
    }),
  ]);

  const confirmedRevenue = round2(
    confirmedOrderRows.reduce((sum, order) => sum + order.total, 0)
  );

  // --- Revenue + order volume over time ---------------------------------
  const dayBuckets = new Map<string, { revenue: number; orderCount: number }>();

  for (const order of confirmedOrderRows) {
    const day = order.createdAt.toISOString().slice(0, 10);
    const bucket = dayBuckets.get(day) ?? { revenue: 0, orderCount: 0 };
    bucket.revenue += order.total;
    bucket.orderCount += 1;
    dayBuckets.set(day, bucket);
  }

  const revenueOverTime: RevenueTimeSeriesPoint[] = Array.from(
    dayBuckets.entries()
  )
    .map(([date, bucket]) => ({
      date,
      revenue: round2(bucket.revenue),
      orderCount: bucket.orderCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- Payment method breakdown -------------------------------------------
  // Always report all three methods, even at zero — a method with no
  // confirmed orders yet is a real, meaningful state to show (not an
  // absence to hide), and the UI should never have to guess whether a
  // missing entry means "zero" or "not loaded".
  const paymentTotals = new Map<PaymentMethod, { orderCount: number; revenue: number }>(
    Object.values(PaymentMethod).map((method) => [method, { orderCount: 0, revenue: 0 }])
  );

  for (const order of confirmedOrderRows) {
    const bucket = paymentTotals.get(order.paymentMethod)!;
    bucket.orderCount += 1;
    bucket.revenue += order.total;
  }

  const paymentMethodBreakdown: PaymentMethodStat[] = Object.values(PaymentMethod).map(
    (method) => {
      const bucket = paymentTotals.get(method)!;
      return {
        method,
        orderCount: bucket.orderCount,
        revenue: round2(bucket.revenue),
      };
    }
  );

  // --- Top pizzas by units sold / revenue (confirmed orders only) --------
  const pizzaTotals = new Map<
    number,
    { name: string; unitsSold: number; revenue: number }
  >();

  for (const item of confirmedOrderItems) {
    const bucket = pizzaTotals.get(item.pizzaId) ?? {
      name: item.name,
      unitsSold: 0,
      revenue: 0,
    };
    bucket.unitsSold += item.quantity;
    bucket.revenue += item.price * item.quantity;
    pizzaTotals.set(item.pizzaId, bucket);
  }

  const topPizzas: TopPizzaStat[] = Array.from(pizzaTotals.entries())
    .map(([pizzaId, bucket]) => ({
      pizzaId,
      name: bucket.name,
      unitsSold: bucket.unitsSold,
      revenue: round2(bucket.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_PIZZAS_LIMIT);

  return {
    confirmedRevenue,
    totalOrders,
    confirmedOrders,
    pendingOrders,
    cancelledOrders,
    totalCustomers,
    revenueOverTime,
    topPizzas,
    paymentMethodBreakdown,
  };
}