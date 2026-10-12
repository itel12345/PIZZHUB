// src/lib/cart.ts
//
// Every route handler in /api/cart/* calls into this file rather than
// touching prisma.cart directly — same reason toPizzaDTO exists for
// Products: one place computes "what does a cart response look like",
// so checkout (when it's built) reads from computeCartSummary too
// instead of re-deriving subtotal/itemCount a second, possibly
// inconsistent way.

import "server-only";
import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

const cartWithItems = {
  items: {
    include: { pizza: true },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartWithItems }>;

export interface CartItemDTO {
  id: string;
  pizzaId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface CartSummaryDTO {
  items: CartItemDTO[];
  itemCount: number;
  subtotal: number;
}

/** Never exposes raw Prisma rows to the client — same DTO discipline
 * as toPizzaDTO in lib/pizza.ts. Subtotal/itemCount are computed here,
 * once, from live price × quantity — never stored, never trusted from
 * anywhere else. */
export function toCartSummaryDTO(cart: CartWithItems): CartSummaryDTO {
  const items: CartItemDTO[] = cart.items.map((item) => ({
    id: item.id,
    pizzaId: item.pizzaId,
    name: item.pizza.name,
    image: item.pizza.image,
    price: item.pizza.price,
    quantity: item.quantity,
    lineTotal: Math.round(item.pizza.price * item.quantity * 100) / 100,
  }));

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100,
  };
}

/** Idempotent — safe to call on every cart request. Cart.userId is
 * @unique in the schema, so this can never create two carts for one
 * user even under concurrent requests (the second create would violate
 * the unique constraint; Prisma surfaces that as P2002, which callers
 * should treat as "someone else already created it, re-fetch"). */
export async function getOrCreateCart(userId: string): Promise<CartWithItems> {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: cartWithItems,
  });

  if (existing) return existing;

  try {
    return await prisma.cart.create({
      data: { userId },
      include: cartWithItems,
    });
  } catch (error) {
    // P2002: unique constraint violation on userId — a concurrent
    // request created the cart between our findUnique and this create.
    // Not an error from the caller's perspective: the cart exists now,
    // just fetch it.
    const existingNow = await prisma.cart.findUnique({
      where: { userId },
      include: cartWithItems,
    });
    if (existingNow) return existingNow;
    throw error;
  }
}

export async function getCartSummary(userId: string): Promise<CartSummaryDTO> {
  const cart = await getOrCreateCart(userId);
  return toCartSummaryDTO(cart);
}

/**
 * Adds a pizza to the cart, incrementing quantity if it's already
 * present. Relies on the @@unique([cartId, pizzaId]) constraint in the
 * schema — upsert against that compound key is atomic, so there's no
 * read-then-write race between "check if it exists" and "increment
 * vs. create" the way a naive findFirst + create/update would have.
 */
export async function addItemToCart(
  userId: string,
  pizzaId: number,
  quantity: number
): Promise<CartSummaryDTO> {
  const cart = await getOrCreateCart(userId);

  await prisma.cartItem.upsert({
    where: { cartId_pizzaId: { cartId: cart.id, pizzaId } },
    create: { cartId: cart.id, pizzaId, quantity },
    update: { quantity: { increment: quantity } },
  });

  return getCartSummary(userId);
}

/**
 * Merges a guest (localStorage) cart into the authenticated user's
 * server cart, called once right after login. Each guest line item
 * increments the matching server line (or creates it) — same upsert
 * pattern as addItemToCart, just looped.
 *
 * Idempotency note: this is NOT safe to call twice with the same guest
 * snapshot without double-counting quantities — the primary defense
 * against that is the client clearing localStorage immediately after a
 * successful merge response (see CartContext), not a server-side
 * dedupe. A true idempotency-key-based guard would need to persist
 * "this guest snapshot was already merged" somewhere, which is more
 * machinery than a v1 cart merge warrants — flagged here rather than
 * silently assumed safe.
 */
export async function mergeGuestCart(
  userId: string,
  guestItems: { pizzaId: number; quantity: number }[]
): Promise<CartSummaryDTO> {
  if (guestItems.length === 0) {
    return getCartSummary(userId);
  }

  const cart = await getOrCreateCart(userId);

  // Only merge pizzas that still exist — a guest cart could reference
  // a pizza that's since been deleted from the catalog (Products
  // module's DELETE is real and admins do use it).
  const validPizzaIds = new Set(
    (
      await prisma.pizza.findMany({
        where: { id: { in: guestItems.map((item) => item.pizzaId) } },
        select: { id: true },
      })
    ).map((pizza) => pizza.id)
  );

  await prisma.$transaction(
    guestItems
      .filter((item) => validPizzaIds.has(item.pizzaId))
      .map((item) =>
        prisma.cartItem.upsert({
          where: { cartId_pizzaId: { cartId: cart.id, pizzaId: item.pizzaId } },
          create: { cartId: cart.id, pizzaId: item.pizzaId, quantity: item.quantity },
          update: { quantity: { increment: item.quantity } },
        })
      )
  );

  return getCartSummary(userId);
}

/** Ownership check baked in: pass the userId that must own this item,
 * throws by returning null if it doesn't — the route handler decides
 * how to respond (404, not 403 — never confirm to a client that a
 * cart item id exists but "isn't theirs"). */
export async function findOwnedCartItem(userId: string, cartItemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== userId) {
    return null;
  }

  return item;
}

/**
 * Empties a user's cart. Added for Checkout: order confirmation must
 * clear the cart server-side, in the same request that confirms the
 * order — not left to a separate client-side call that could fail to
 * fire after a network hiccup right after checkout, leaving stale
 * items despite the order having succeeded.
 *
 * The existing DELETE /api/cart route now calls this too, rather than
 * duplicating the same three lines — this is a refactor of existing
 * logic into one place, not new cart behavior.
 */
export async function clearCart(userId: string): Promise<void> {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return;
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}