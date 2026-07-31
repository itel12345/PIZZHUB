// src/components/orders/storage/orderStorage.ts
//
// Temporary localStorage persistence for completed orders. This is the
// ONLY file that touches localStorage for the orders feature — same
// isolation principle as cartStorage.ts and favoritesStorage.ts, so that
// when Prisma/PostgreSQL is connected, this is the only file that needs
// rewriting (swap load/save for real database calls). Nothing else in
// the app should ever import from localStorage directly for orders.
//
// Not wired up to CheckoutPage or Order Success yet — this phase is the
// storage layer only.

import type { CartItem } from "@/components/cart";

// Reusing the existing CartItem type directly (per the brief) rather
// than redefining a parallel "OrderLineItem" shape — one source of
// truth for what a line item looks like, whether it's sitting in an
// active cart or already locked into a placed order.
export interface Order {
  id: string;
  placedAt: string; // ISO timestamp
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    deliveryInstructions: string;
  };
  deliveryMethod: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

const STORAGE_KEY = "pizzhub-orders";

/**
 * Type guard that validates a single unknown value looks like an Order.
 * Guards against corrupted JSON or a stale/old-shape record ending up in
 * localStorage (e.g. from a previous, incompatible version of this
 * feature) — a bad record is skipped rather than crashing the app.
 */
function isValidOrder(value: unknown): value is Order {
  if (typeof value !== "object" || value === null) return false;
  const order = value as Record<string, unknown>;

  if (typeof order.id !== "string" || order.id.length === 0) return false;
  if (typeof order.placedAt !== "string") return false;
  if (typeof order.deliveryMethod !== "string") return false;
  if (typeof order.paymentMethod !== "string") return false;
  if (
    typeof order.subtotal !== "number" ||
    typeof order.deliveryFee !== "number" ||
    typeof order.tax !== "number" ||
    typeof order.total !== "number"
  ) {
    return false;
  }

  const customer = order.customer as Record<string, unknown> | undefined;
  if (
    typeof customer !== "object" ||
    customer === null ||
    typeof customer.fullName !== "string" ||
    typeof customer.email !== "string" ||
    typeof customer.phone !== "string"
  ) {
    return false;
  }

  const address = order.address as Record<string, unknown> | undefined;
  if (
    typeof address !== "object" ||
    address === null ||
    typeof address.street !== "string" ||
    typeof address.city !== "string" ||
    typeof address.region !== "string" ||
    typeof address.postalCode !== "string" ||
    typeof address.deliveryInstructions !== "string"
  ) {
    return false;
  }

  if (!Array.isArray(order.items)) return false;

  return true;
}

/**
 * Reads the raw orders array out of localStorage.
 * Centralized here so both getOrders() and getLatestOrder() share one
 * parsing/validation path instead of duplicating try/catch logic.
 */
function readOrders(): Order[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidOrder);
  } catch {
    // Corrupt JSON, disabled storage, or any other unexpected failure —
    // treat it as no orders rather than throwing.
    return [];
  }
}

/**
 * Writes the given orders array to localStorage.
 * Silently no-ops on failure (e.g. storage disabled, quota exceeded,
 * private browsing restrictions) — never throws.
 */
function writeOrders(orders: Order[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Intentionally swallowed — persistence is best-effort only.
  }
}

/**
 * Returns every stored order, newest first.
 * Returns [] if storage is empty, unavailable, or corrupted.
 */
export function getOrders(): Order[] {
  return readOrders();
}

/**
 * Adds one order to storage. New orders are inserted at the front of
 * the list so the most recently placed order is always first — this is
 * what lets getLatestOrder() stay a trivial `orders[0]` lookup instead
 * of needing to sort by placedAt on every read.
 */
export function saveOrder(order: Order): void {
  const orders = readOrders();
  writeOrders([order, ...orders]);
}

/**
 * Returns the most recently placed order, or null if none exist.
 * This is the function Order Success will eventually use to display
 * "your order" right after checkout, without needing an order ID passed
 * through the URL.
 */
export function getLatestOrder(): Order | null {
  const orders = readOrders();
  return orders.length > 0 ? orders[0] : null;
}

/**
 * Removes every stored order. Useful during development for resetting
 * state between test runs, and later as the basis for a real "clear
 * order history" action if one is ever needed.
 */
export function clearOrders(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Intentionally swallowed.
  }
}