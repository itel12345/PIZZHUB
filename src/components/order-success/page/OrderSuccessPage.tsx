// src/components/order-success/page/OrderSuccessPage.tsx
//
// Confirmation page shown after a successful checkout. Loads the order
// by id (passed via ?orderId= in the URL by CheckoutPage's redirect)
// through useOrder() — a real, ownership-checked server fetch, not
// "whatever's most recent in this browser's localStorage". If no
// orderId is present, or the fetch comes back not-found/not-yours,
// redirects to /menu instead of showing fake data — same fallback
// behavior as before, just triggered by a real failure mode now
// instead of an empty localStorage array.
//
// Order items/pricing are read from the order record itself, NOT from
// useCart() — by this point the cart has already been cleared server-
// side as part of order confirmation, so the order's own snapshot
// (items, subtotal, deliveryFee, tax, total) is the only correct
// source for what was actually ordered.

"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useOrder, type Order } from "@/components/orders";
import { useCart } from "@/components/cart";
import { getStoredAuthToken } from "@/components/auth";
import styles from "./OrderSuccessPage.module.css";

// Human-readable labels for the value-based options chosen in Checkout.
// Kept local to this file rather than imported from DeliveryMethod/
// PaymentMethod, since those components export only their own prop
// types, not label lookups — duplicating two small label maps here is
// simpler than restructuring those files for this phase.
const DELIVERY_METHOD_LABELS: Record<string, string> = {
  standard: "Standard Delivery",
  express: "Express Delivery",
  pickup: "Pickup",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  momo: "Mobile Money",
};

function formatPlacedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAddress(order: Order): string {
  const { street, city, region, postalCode } = order.address;
  const parts = [street, city, region].filter(Boolean);
  const line = parts.join(", ");
  return postalCode ? `${line}, ${postalCode}` : line;
}

export function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const { order, isLoading, notFound, pollTimedOut, retry } = useOrder(orderId);
  const { clearCart } = useCart();

  // Redirects away once we're certain there's nothing real to show —
  // either no orderId was in the URL at all, or the fetch confirmed
  // it doesn't exist / isn't this user's order. Never redirects while
  // still loading — that would fire on every legitimate visit before
  // the fetch had a chance to complete.
  useEffect(() => {
    if (!isLoading && notFound) {
      router.replace("/menu");
    }
  }, [isLoading, notFound, router]);

  // CartContext has no way to know the Paystack webhook cleared the
  // server-side cart out from under it — the checkout redirect to
  // Paystack was a full page navigation, which tears down and
  // recreates CartContext fresh; it fetches once on mount and has no
  // channel back to this page's own order-status polling. This is
  // that missing channel: the moment THIS page observes the order
  // becoming confirmed, tell CartContext to sync. clearCart() is
  // idempotent (COD already calls it directly, unaffected by this) —
  // calling it again here when the cart's already empty server-side
  // is a harmless no-op, not a double-clear bug.
  const hasSyncedCartRef = useRef(false);
  useEffect(() => {
    if (order?.status === "confirmed" && !hasSyncedCartRef.current) {
      hasSyncedCartRef.current = true;
      clearCart();
    }
  }, [order?.status, clearCart]);

  // Resolves the one gap the webhook alone can't cover: a customer who
  // cancels before ever attempting a charge produces no charge event
  // at all, so nothing would otherwise ever move this order out of
  // "pending". Fires exactly once, only while the order is genuinely
  // still pending — actively asks Paystack what happened instead of
  // waiting on a push that, for a pure cancellation, never arrives.
  // retry() is useOrder's existing, already-built refetch trigger —
  // this doesn't touch useOrder.ts's own polling logic at all, it just
  // calls the same mechanism a fresh time once the server-side status
  // has actually been resolved by the call below.
  const hasTriggeredVerifyRef = useRef(false);
  useEffect(() => {
    if (order?.status !== "pending" || hasTriggeredVerifyRef.current || !orderId) {
      return;
    }
    hasTriggeredVerifyRef.current = true;

    const token = getStoredAuthToken();
    void fetch("/api/checkout/paystack/verify-return", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ orderId }),
    })
      .then(() => retry())
      .catch(() => {
        // Best-effort — if this fails (network hiccup, etc.), the
        // existing poll and its timeout/"Check again" fallback are
        // still there exactly as before. This is a faster resolution
        // path layered on top, not a replacement for them.
      });
  }, [order?.status, orderId, retry]);

  if (isLoading || !order) {
    // Either still loading, or the redirect above is in flight for a
    // not-found/not-yours order — render nothing rather than a flash
    // of placeholder content either way.
    return null;
  }

  if (order.status === "pending") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.pendingSpinner} aria-hidden="true" />
            <h1 className={styles.heading}>Confirming your payment…</h1>
            <p className={styles.message}>
              {pollTimedOut
                ? "This is taking longer than expected. Your payment may still be processing."
                : "This usually takes just a few seconds. Don't close this page."}
            </p>
            {pollTimedOut && (
              <button
                type="button"
                className={styles.cancelledCartLink}
                onClick={retry}
              >
                Check again
              </button>
            )}
          </section>
        </div>
      </div>
    );
  }

  if (order.status === "cancelled") {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <h1 className={styles.heading}>Payment wasn&apos;t completed</h1>
            <p className={styles.message}>
              This order wasn&apos;t confirmed — no charge was made. You can
              try again from your cart.
            </p>
            <Link href="/cart" className={styles.cancelledCartLink}>
              Return to cart
            </Link>
          </section>
        </div>
      </div>
    );
  }

  const deliveryMethodLabel =
    DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod;
  const paymentMethodLabel =
    PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* SECTION 1 — Success Hero */}
        <section className={styles.hero}>
          <div className={styles.successIcon} aria-hidden="true">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle
                className={styles.iconCircle}
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className={styles.iconCheck}
                d="M24 41l11 11 21-23"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          <h1 className={styles.heading}>Order Confirmed!</h1>
          <p className={styles.message}>
            Thank you, {order.customer.fullName}! We&apos;ve received your order
            and our chefs are already preparing your delicious pizza.
          </p>
        </section>

        <div className={styles.layout}>
          {/* Left column: Order Info + Delivery Info */}
          <div className={styles.detailsColumn}>
            {/* SECTION 2 — Order Information */}
            <section className={styles.card} aria-labelledby="order-info-heading">
              <h2 id="order-info-heading" className={styles.cardHeading}>
                Order Information
              </h2>
              <dl className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <dt>Order Number</dt>
                  <dd className={styles.infoValueAccent}>{order.id}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt>Placed</dt>
                  <dd>{formatPlacedAt(order.placedAt)}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt>Delivery Method</dt>
                  <dd>{deliveryMethodLabel}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt>Payment Method</dt>
                  <dd>{paymentMethodLabel}</dd>
                </div>
              </dl>
            </section>

            {/* SECTION 3 — Delivery Information */}
            <section className={styles.card} aria-labelledby="delivery-info-heading">
              <h2 id="delivery-info-heading" className={styles.cardHeading}>
                Delivery Information
              </h2>
              <dl className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <dt>Customer Name</dt>
                  <dd>{order.customer.fullName}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt>Customer Email</dt>
                  <dd>{order.customer.email || "—"}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt>Phone Number</dt>
                  <dd>{order.customer.phone}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt>Delivery Address</dt>
                  <dd>{formatAddress(order)}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt>Delivery Instructions</dt>
                  <dd>
                    {order.address.deliveryInstructions ||
                      "No delivery instructions."}
                  </dd>
                </div>
              </dl>
            </section>

            {/* SECTION 6 — Support */}
            <section className={styles.support} aria-labelledby="support-heading">
              <h2 id="support-heading" className={styles.supportHeading}>
                Need help with your order?
              </h2>
              <p className={styles.supportMessage}>
                Our support team is always ready to help.
              </p>
              <Link href="/contact" className={styles.supportLink}>
                Contact Us
              </Link>
            </section>
          </div>

          {/* Right column: SECTION 4 — Order Summary */}
          <aside className={styles.summaryColumn} aria-label="Order summary">
            <section className={styles.card}>
              <h2 className={styles.cardHeading}>Order Summary</h2>

              <ul className={styles.items}>
                {order.items.map((item) => (
                  <li key={item.pizzaId} className={styles.item}>
                    <div className={styles.itemImageWrapper}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className={styles.itemImage}
                      />
                    </div>
                    <div className={styles.itemDetails}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemMeta}>
                        Qty {item.quantity} · ${item.price.toFixed(2)} each
                      </span>
                    </div>
                    <span className={styles.itemTotal}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className={styles.divider} />

              <dl className={styles.totalsGrid}>
                <div className={styles.totalRow}>
                  <dt>Subtotal</dt>
                  <dd>${order.subtotal.toFixed(2)}</dd>
                </div>
                <div className={styles.totalRow}>
                  <dt>Delivery Fee</dt>
                  <dd>${order.deliveryFee.toFixed(2)}</dd>
                </div>
                <div className={styles.totalRow}>
                  <dt>Tax</dt>
                  <dd>${order.tax.toFixed(2)}</dd>
                </div>
              </dl>

              <div className={styles.divider} />

              <div className={styles.grandTotalRow}>
                <span>Grand Total</span>
                <span className={styles.grandTotalValue}>
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </section>
          </aside>
        </div>

        {/* SECTION 5 — Action Buttons */}
        <div className={styles.actions}>
          <Link href="/" className={styles.homeButton}>
            🏠 Back Home
          </Link>
          <Link href="/menu" className={styles.menuButton}>
            🍕 Browse Menu
          </Link>
        </div>
      </div>
    </div>
  );
}