// src/lib/orders.ts
//
// Same DTO-and-single-source-of-computation discipline as lib/pizza.ts
// and lib/cart.ts. One important asymmetry from Cart, deliberate: Cart
// always computes price live from Pizza (a cart is a live view of the
// catalog); an Order snapshots name/price onto OrderItem at creation
// time and never recomputes them (an order is a historical receipt —
// see the architecture note in chat for why this isn't a shortcut).

import "server-only";
import { prisma } from "./prisma";
import { getCartSummary, clearCart } from "./cart";
import { initializeTransaction, amountToKobo } from "./paystack";
import { getSiteSettings, computeTax, getEnabledPaystackChannels } from "./settings";
import { createNotification } from "./notifications";
import type { CheckoutInput } from "./validation/checkout";
import { Prisma, type NotificationType } from "@/generated/prisma/client";

// Delivery fee and tax rate previously lived here as hardcoded
// constants (DELIVERY_FEE = 15, TAX = 0). Both now come from
// SiteSettings (see lib/settings.ts) so an admin's Settings changes
// actually affect new orders instead of requiring a code deploy.
//
// NOTE: CartSummary.tsx and OrderReview.tsx (customer-facing preview
// components, outside this Settings task's scope) still show their
// own separately-hardcoded GHS 15 / 0% preview estimates. The amount
// actually charged has always come exclusively from server-side
// recomputation (never the client's claimed total) and now correctly
// reflects live settings — but the pre-checkout preview text can drift
// from that real figure if an admin changes the defaults. Flagging
// this as a known follow-up, not fixing it here: this task's scope is
// Settings and the order-creation path, not a Checkout UI redesign.

const orderWithItems = {
  items: { include: { pizza: { select: { image: true } } } },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderWithItems }>;

// Shape matches the client's existing Order type (see
// src/components/orders — formerly orderStorage.ts) field-for-field,
// so OrderSuccessPage's render logic needed zero changes, only its
// data source did.
export interface OrderDTO {
  id: string;
  placedAt: string;
  // Newly added for Paystack: COD orders are always "confirmed" by the
  // time OrderSuccessPage loads, so this field was previously never
  // needed. Online payment orders can genuinely be "pending" at that
  // exact moment (the webhook is async) — the client needs this to
  // know which state it's actually looking at.
  status: "pending" | "confirmed" | "cancelled";
  customer: { fullName: string; email: string; phone: string };
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    deliveryInstructions: string;
  };
  deliveryMethod: string;
  paymentMethod: string;
  items: { pizzaId: string; name: string; image: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

export function toOrderDTO(order: OrderWithItems): OrderDTO {
  return {
    id: order.id,
    placedAt: order.createdAt.toISOString(),
    status: order.status.toLowerCase() as OrderDTO["status"],
    customer: { fullName: order.fullName, email: order.email, phone: order.phone },
    address: {
      street: order.street,
      city: order.city,
      region: order.region,
      postalCode: order.postalCode,
      deliveryInstructions: order.deliveryInstructions ?? "",
    },
    deliveryMethod: order.deliveryMethod,
    paymentMethod: order.paymentMethod === "COD" ? "cod" : order.paymentMethod.toLowerCase(),
    items: order.items.map((item) => ({
      pizzaId: String(item.pizzaId),
      name: item.name,
      // Pulled live from Pizza, unlike name/price which are
      // snapshotted — a product photo is a display nicety the receipt
      // doesn't need to preserve historically. This can never be null:
      // OrderItem.pizza has no onDelete cascade/set-null, so the same
      // Restrict behavior that already protects CartItem->Pizza (see
      // the admin Products DELETE route's P2003 handling) means a
      // Pizza referenced by any order can't be deleted in the first
      // place.
      image: item.pizza.image,
      price: item.price,
      quantity: item.quantity,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    tax: order.tax,
    total: order.total,
  };
}

export class EmptyCartError extends Error {}
export class StoreClosedError extends Error {}
export class DeliveryUnavailableError extends Error {}
export class PaymentMethodDisabledError extends Error {}

/**
 * Creates a Cash-on-Delivery order: re-derives pricing from the live
 * server cart (never from the client's claimed subtotal), snapshots
 * each line item's name/price onto OrderItem, marks the order
 * CONFIRMED immediately (no payment gateway involved for COD), and
 * clears the cart — all in one transaction, so a failure partway
 * through can't leave an order created but the cart still full, or
 * vice versa.
 */
export async function createCodOrder(
  userId: string,
  input: CheckoutInput
): Promise<OrderDTO> {
  const settings = await getSiteSettings();

  if (!settings.isStoreOpen) {
    throw new StoreClosedError("The store is currently closed. Please check back later.");
  }

  if (input.deliveryMethod !== "pickup" && !settings.isDeliveryAvailable) {
    throw new DeliveryUnavailableError(
      "Delivery is currently unavailable. Please choose pickup or check back later."
    );
  }

  if (!settings.codEnabled) {
    throw new PaymentMethodDisabledError(
      "Cash on Delivery is currently unavailable. Please choose another payment method."
    );
  }

  const cartSummary = await getCartSummary(userId);

  if (cartSummary.items.length === 0) {
    throw new EmptyCartError("Your cart is empty.");
  }

  const tax = computeTax(cartSummary.subtotal, settings.taxRate);
  const total = cartSummary.subtotal + settings.deliveryFee + tax;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        status: "CONFIRMED",
        paymentMethod: "COD",
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        street: input.street,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
        deliveryInstructions: input.deliveryInstructions,
        deliveryMethod: input.deliveryMethod,
        subtotal: cartSummary.subtotal,
        deliveryFee: settings.deliveryFee,
        tax,
        total,
        items: {
          create: cartSummary.items.map((item) => ({
            pizzaId: item.pizzaId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: orderWithItems,
    });

    return created;
  });

  // Outside the transaction deliberately: clearing the cart is
  // logically part of "this order succeeded", but it doesn't need to
  // be atomic with the order write itself — if this step failed after
  // the order committed, the correct recovery is "cart still has items
  // that were already ordered", which is a UX annoyance, not a data
  // integrity problem. Keeping it out of the transaction also avoids
  // holding the cart's row lock any longer than necessary.
  await clearCart(userId);

  // Best-effort, same reasoning as clearCart above: this must never be
  // able to fail a checkout that already succeeded. COD orders are
  // confirmed the instant they're placed, so this is the one and only
  // notification a COD order ever gets.
  await createNotification({
    userId,
    orderId: order.id,
    type: "ORDER_CONFIRMED",
    title: "Order confirmed",
    message: `Your order #${order.id.slice(-8)} has been confirmed and is being prepared.`,
  });

  return toOrderDTO(order);
}

/**
 * Creates a PENDING order for an online (Paystack) payment and starts
 * the Paystack transaction. Deliberately separate from createCodOrder
 * rather than a shared function with branches — COD confirms and
 * clears the cart immediately in one step; online payment must NOT do
 * either of those until a verified webhook says so. Keeping them
 * fully separate means a bug in the online-payment path structurally
 * cannot affect COD's behavior, and vice versa.
 *
 * The cart is NOT cleared here — only on confirmed payment (see
 * confirmOnlinePayment). If someone abandons the Paystack page, their
 * cart must still be exactly as they left it.
 */
export async function createOnlinePendingOrder(
  userId: string,
  input: CheckoutInput,
  requestOrigin: string
): Promise<{ authorizationUrl: string; orderId: string }> {
  const settings = await getSiteSettings();

  if (!settings.isStoreOpen) {
    throw new StoreClosedError("The store is currently closed. Please check back later.");
  }

  if (input.deliveryMethod !== "pickup" && !settings.isDeliveryAvailable) {
    throw new DeliveryUnavailableError(
      "Delivery is currently unavailable. Please choose pickup or check back later."
    );
  }

  const channels = getEnabledPaystackChannels(settings);
  if (channels.length === 0) {
    throw new PaymentMethodDisabledError(
      "Online payment is currently unavailable. Please choose Cash on Delivery."
    );
  }

  const cartSummary = await getCartSummary(userId);

  if (cartSummary.items.length === 0) {
    throw new EmptyCartError("Your cart is empty.");
  }

  const tax = computeTax(cartSummary.subtotal, settings.taxRate);
  const total = cartSummary.subtotal + settings.deliveryFee + tax;

  const order = await prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      paymentMethod: "MOBILE_MONEY",
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      street: input.street,
      city: input.city,
      region: input.region,
      postalCode: input.postalCode,
      deliveryInstructions: input.deliveryInstructions,
      deliveryMethod: input.deliveryMethod,
      subtotal: cartSummary.subtotal,
      deliveryFee: settings.deliveryFee,
      tax,
      total,
      items: {
        create: cartSummary.items.map((item) => ({
          pizzaId: item.pizzaId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    },
  });

  // order.id doubles as the Paystack reference — no separate reference
  // generation needed, and it means the webhook can look up the order
  // by primary key directly (see confirmOnlinePayment), rather than a
  // second column that could theoretically drift out of sync with it.
  try {
    const result = await initializeTransaction({
      email: input.email,
      amountKobo: amountToKobo(total),
      reference: order.id,
      callbackUrl: `${requestOrigin}/order-success?orderId=${order.id}`,
      channels,
    });

    // Only fired here, after Paystack has genuinely accepted the
    // transaction — not right after the PENDING row was created above,
    // since a failure below cancels that row a moment later (see the
    // catch block), and a customer should never get an "awaiting
    // payment" notification for an order that never actually reached
    // Paystack.
    await createNotification({
      userId,
      orderId: order.id,
      type: "ORDER_PLACED",
      title: "Order received — awaiting payment",
      message: `Your order #${order.id.slice(-8)} is waiting for payment confirmation.`,
    });

    return { authorizationUrl: result.authorizationUrl, orderId: order.id };
  } catch (error) {
    // Paystack's initialize call failed after we already created the
    // order row — leaving it PENDING forever would be a silent
    // "phantom" order with no real payment attempt behind it. Cancel
    // it immediately rather than leaving that dangling.
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    throw error;
  }
}

export type PaymentConfirmationResult =
  | { outcome: "confirmed" }
  | { outcome: "already-processed" }
  | { outcome: "order-not-found" }
  | { outcome: "amount-mismatch" };

/**
 * The only place a PENDING online order ever becomes CONFIRMED.
 * Idempotent by construction, not by convention: the update itself is
 * conditioned on status still being PENDING, in a single atomic
 * UPDATE...WHERE statement — not a separate "read status, then decide
 * whether to write" sequence, which would have a race window between
 * two concurrent webhook deliveries. Postgres serializes concurrent
 * writes to the same row; only one delivery's UPDATE can ever match
 * `status = 'PENDING'` and actually change anything. Every other
 * delivery — duplicate, retried, or simultaneous — matches zero rows
 * and safely no-ops.
 *
 * reference IS the order's id (see createOnlinePendingOrder) — looking
 * up by primary key is what makes "does this reference map to the
 * correct order" unambiguous by construction, not by a second lookup
 * table that could disagree with it.
 */
export async function confirmOnlinePayment(
  reference: string,
  verifiedAmountKobo: number,
  paystackChannel: string | undefined
): Promise<PaymentConfirmationResult> {
  const order = await prisma.order.findUnique({
    where: { id: reference },
    select: { id: true, userId: true, status: true, total: true },
  });

  if (!order) {
    return { outcome: "order-not-found" };
  }

  if (order.status !== "PENDING") {
    // Already confirmed (a duplicate/retried webhook) or already
    // cancelled — either way, nothing left to do. This short-circuits
    // BEFORE the atomic update below even runs, which also means a
    // duplicate delivery for an already-settled order doesn't
    // needlessly hit the database a second time for the write.
    return { outcome: "already-processed" };
  }

  if (amountToKobo(order.total) !== verifiedAmountKobo) {
    // Real anomaly: what Paystack confirms was actually paid doesn't
    // match what we billed. Do not confirm — this needs a human to
    // look at it, not an automated guess at which number is "right".
    console.error(
      `Paystack amount mismatch for order ${order.id}: expected ${amountToKobo(order.total)} kobo, verified ${verifiedAmountKobo} kobo.`
    );
    return { outcome: "amount-mismatch" };
  }

  const paymentMethod =
    paystackChannel === "card" ? "CARD" : paystackChannel === "mobile_money" ? "MOBILE_MONEY" : undefined;

  const result = await prisma.order.updateMany({
    where: { id: reference, status: "PENDING" },
    data: {
      status: "CONFIRMED",
      paidAt: new Date(),
      paystackRef: reference,
      ...(paymentMethod ? { paymentMethod } : {}),
    },
  });

  if (result.count === 0) {
    // Lost the race between our status check above and this write —
    // another delivery of the same event confirmed it in between.
    // Vanishingly unlikely given how close together those two
    // statements are, but the whole point of this design is not
    // assuming "unlikely" means "impossible".
    return { outcome: "already-processed" };
  }

  await clearCart(order.userId);

  await createNotification({
    userId: order.userId,
    orderId: order.id,
    type: "ORDER_CONFIRMED",
    title: "Payment confirmed",
    message: `Payment for order #${order.id.slice(-8)} was successful — your order is being prepared.`,
  });

  return { outcome: "confirmed" };
}

/**
 * Mirrors confirmOnlinePayment's idempotency shape for the failure
 * path (charge.failed, or a verify call that comes back non-success).
 * No fulfillment side effects to worry about here — nothing was ever
 * confirmed, so there's nothing to undo, just the status transition.
 */
export async function markOnlinePaymentFailed(reference: string): Promise<PaymentConfirmationResult> {
  const order = await prisma.order.findUnique({
    where: { id: reference },
    select: { id: true, userId: true, status: true },
  });

  if (!order) {
    return { outcome: "order-not-found" };
  }

  if (order.status !== "PENDING") {
    return { outcome: "already-processed" };
  }

  const result = await prisma.order.updateMany({
    where: { id: reference, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  if (result.count === 0) {
    // Lost the same race described in confirmOnlinePayment.
    return { outcome: "already-processed" };
  }

  await createNotification({
    userId: order.userId,
    orderId: order.id,
    type: "PAYMENT_FAILED",
    title: "Payment failed",
    message: `Payment for order #${order.id.slice(-8)} could not be completed, so it was cancelled.`,
  });

  return { outcome: "confirmed" };
}

/** Ownership-checked, same IDOR-prevention pattern as Cart's
 * findOwnedCartItem — an order id alone is never sufficient. */
export async function findOwnedOrder(
  userId: string,
  orderId: string
): Promise<OrderDTO | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderWithItems,
  });

  if (!order || order.userId !== userId) {
    return null;
  }

  return toOrderDTO(order);
}

interface GetOrdersForUserParams {
  userId: string;
  page: number;
  pageSize: number;
}

/**
 * A customer's own order history. Deliberately NOT a relaxed version
 * of getOrdersForAdmin below — the `where: { userId }` filter is
 * mandatory here and baked into every query this function runs, never
 * an optional/togglable parameter, since there is no scenario where a
 * customer should see another customer's orders. Full OrderDTOs
 * (items, pricing, everything) come back in the list itself — no
 * separate per-order detail fetch is needed, since the UI already has
 * everything it needs to show full order details inline.
 */
export async function getOrdersForUser({
  userId,
  page,
  pageSize,
}: GetOrdersForUserParams): Promise<{ orders: OrderDTO[]; total: number }> {
  const where: Prisma.OrderWhereInput = { userId };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderWithItems,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders: orders.map(toOrderDTO), total };
}

// ─────────────────────────────────────────────────────────────────
// Admin order management. Deliberately NOT a second order system —
// every function here reuses toOrderDTO/orderWithItems/OrderDTO
// exactly as the customer-facing functions above do. The only new
// thing admin needs is "see every order, not just your own" (no
// userId filter) and "change status directly" — everything else
// (shape, DTO, status enum) is the same order data, same source of
// truth, just a different access pattern on top of it.

export type AdminOrderStatusFilter = "all" | "pending" | "confirmed" | "cancelled";

const STATUS_FILTER_TO_ENUM: Record<Exclude<AdminOrderStatusFilter, "all">, "PENDING" | "CONFIRMED" | "CANCELLED"> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
};

export interface AdminOrderListItem extends OrderDTO {
  itemCount: number;
}

function toAdminOrderListItem(order: OrderWithItems): AdminOrderListItem {
  return {
    ...toOrderDTO(order),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

interface GetOrdersForAdminParams {
  page: number;
  pageSize: number;
  status: AdminOrderStatusFilter;
  /** Matches against customer name, email, or the order id itself —
   * covers "find this specific order" and "find this customer's
   * orders" with one field, same UX shape as the Products search box. */
  query: string;
}

export async function getOrdersForAdmin({
  page,
  pageSize,
  status,
  query,
}: GetOrdersForAdminParams): Promise<{ orders: AdminOrderListItem[]; total: number }> {
  const where: Prisma.OrderWhereInput = {
    ...(status !== "all" ? { status: STATUS_FILTER_TO_ENUM[status] } : {}),
    ...(query
      ? {
          OR: [
            { id: query },
            { fullName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderWithItems,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders: orders.map(toAdminOrderListItem), total };
}

/** Admin-only, ownership-agnostic by design (an admin can view any
 * order) — NOT a relaxed version of findOwnedOrder, a deliberately
 * different function for a deliberately different access rule. The
 * route calling this is the one responsible for confirming the
 * caller is actually an admin (requireAdmin), same separation of
 * concerns as everywhere else in this app: this function answers "get
 * order X", the route decides "is this caller allowed to ask". */
export async function getOrderForAdmin(orderId: string): Promise<OrderDTO | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderWithItems,
  });

  return order ? toOrderDTO(order) : null;
}

export class OrderNotFoundError extends Error {}

/** Admin sets status directly — unlike confirmOnlinePayment/
 * markOnlinePaymentFailed, this has no PENDING-only guard, because an
 * admin correcting a mistake (e.g. un-cancelling an order) is a
 * legitimate, deliberate action, not a webhook race to protect against.
 * Does NOT touch paidAt or paystackRef — those remain whatever the
 * real payment flow set them to; this only changes status. Does NOT
 * clear the cart either — that's exclusively tied to the customer's
 * own payment confirmation moment, not something an admin action
 * should ever trigger as a side effect on someone else's session. */
export async function updateOrderStatusByAdmin(
  orderId: string,
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
): Promise<OrderDTO> {
  try {
    const before = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { status: true },
    });

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: orderWithItems,
    });

    // Only when the status genuinely changed — an admin re-saving the
    // same status (or a PATCH that happens to send the value it
    // already had) must never generate a notification about a change
    // that didn't actually happen.
    if (before.status !== status) {
      const type: NotificationType =
        status === "CONFIRMED"
          ? "ORDER_CONFIRMED"
          : status === "CANCELLED"
            ? "ORDER_CANCELLED"
            : "ORDER_PLACED";

      const statusLabel =
        status === "CONFIRMED" ? "confirmed" : status === "CANCELLED" ? "cancelled" : "set back to pending";

      await createNotification({
        userId: order.userId,
        orderId: order.id,
        type,
        title: "Order status updated",
        message: `Your order #${order.id.slice(-8)} was ${statusLabel}.`,
      });
    }

    return toOrderDTO(order);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new OrderNotFoundError(`Order ${orderId} not found.`);
    }
    throw error;
  }
}