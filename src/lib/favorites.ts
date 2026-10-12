// src/lib/favorites.ts
//
// Same single-source-of-truth discipline as lib/cart.ts and
// lib/orders.ts. Simpler than both: a favorite has no quantity, no
// price, no snapshotting — it's just "does this (userId, pizzaId) pair
// exist", so there's no DTO shaping needed beyond a plain string array
// of pizza ids, matching exactly what FavoritesContext's public shape
// already expects.

import "server-only";
import { prisma } from "./prisma";

/** Returns the user's favorite pizza ids as strings — matches the
 * client-side shape (FavoritesContext's `favorites: string[]`)
 * directly, no DTO mapping layer needed for something this simple. */
export async function getFavoritePizzaIds(userId: string): Promise<string[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { pizzaId: true },
  });
  return favorites.map((favorite) => String(favorite.pizzaId));
}

/**
 * Idempotent by design: relies on the @@unique([userId, pizzaId])
 * constraint the same way addItemToCart relies on
 * @@unique([cartId, pizzaId]) — upsert with an empty update means
 * "create it if it's not there, otherwise do nothing", so calling this
 * twice for the same pizza is a harmless no-op, never a duplicate row
 * and never an error.
 */
export async function addFavorite(userId: string, pizzaId: number): Promise<void> {
  await prisma.favorite.upsert({
    where: { userId_pizzaId: { userId, pizzaId } },
    create: { userId, pizzaId },
    update: {},
  });
}

/** Also idempotent — deleting a favorite that isn't there just
 * matches zero rows, deleteMany doesn't throw the way delete() would
 * on a not-found id. */
export async function removeFavorite(userId: string, pizzaId: number): Promise<void> {
  await prisma.favorite.deleteMany({
    where: { userId, pizzaId },
  });
}

/**
 * Merges guest (localStorage) favorites into the server on login.
 * Simpler than mergeGuestCart — no quantity to increment, just
 * "create if missing" per id, so this can safely run more than once
 * without double-counting anything (unlike the cart merge, which
 * explicitly documents that it is NOT safe to call twice). Still
 * relies on the client clearing localStorage after a successful
 * response, same as Cart, just for a different reason: not to prevent
 * double-counting, but so a later logout/login cycle doesn't keep
 * resurrecting stale guest-favorited ids from before.
 */
export async function mergeGuestFavorites(
  userId: string,
  guestPizzaIds: number[]
): Promise<string[]> {
  if (guestPizzaIds.length > 0) {
    const validPizzaIds = new Set(
      (
        await prisma.pizza.findMany({
          where: { id: { in: guestPizzaIds } },
          select: { id: true },
        })
      ).map((pizza) => pizza.id)
    );

    await prisma.$transaction(
      guestPizzaIds
        .filter((id) => validPizzaIds.has(id))
        .map((pizzaId) =>
          prisma.favorite.upsert({
            where: { userId_pizzaId: { userId, pizzaId } },
            create: { userId, pizzaId },
            update: {},
          })
        )
    );
  }

  return getFavoritePizzaIds(userId);
}