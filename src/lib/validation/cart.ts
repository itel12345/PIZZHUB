// src/lib/validation/cart.ts
//
// Same discipline as src/lib/validation/product.ts: one schema, used by
// both the client (instant feedback) and the API routes (the actual
// authority). The client never gets to decide what's valid — it just
// gets to fail fast with the same message the server would give.

import { z } from "zod";

// 20 isn't an arbitrary UX nicety — it's a ceiling against someone
// scripting `quantity: 999999` at the API boundary. A person ordering
// pizza has no legitimate reason to want 500 of one pizza in a single
// cart line; if that's ever real, it's a catering feature with its own
// rules, not a quantity field with no ceiling.
const MAX_QUANTITY = 20;

export const addCartItemSchema = z.object({
  pizzaId: z.coerce
    .number({ message: "pizzaId must be a number." })
    .int("pizzaId must be an integer.")
    .positive("pizzaId must be a positive integer."),
  quantity: z.coerce
    .number({ message: "quantity must be a number." })
    .int("quantity must be a whole number.")
    .min(1, "quantity must be at least 1.")
    .max(MAX_QUANTITY, `quantity can't exceed ${MAX_QUANTITY}.`)
    .default(1),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemQuantitySchema = z.object({
  quantity: z.coerce
    .number({ message: "quantity must be a number." })
    .int("quantity must be a whole number.")
    .min(1, "quantity must be at least 1. To remove the item, delete it instead.")
    .max(MAX_QUANTITY, `quantity can't exceed ${MAX_QUANTITY}.`),
});

export type UpdateCartItemQuantityInput = z.infer<
  typeof updateCartItemQuantitySchema
>;

// Used only by /api/cart/merge — the shape of what the guest cart in
// localStorage looks like when it arrives at the server. Deliberately
// narrow: only pizzaId + quantity matter server-side, everything else
// (name/image/price) in the client's local CartItem is re-derived from
// the DB, never trusted from the merge payload.
export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        pizzaId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY),
      })
    )
    .max(50, "Too many items to merge at once."),
});

export type MergeCartInput = z.infer<typeof mergeCartSchema>;