// src/lib/pizza.ts
//
// Single source of truth for turning a raw Prisma `Pizza` row into the
// shape every UI component actually consumes (`Pizza` below). Nothing
// outside this file should hand-roll the `id: "p-01"` string or reach
// into a raw Prisma row directly — always go through toPizzaDTO().
//
// Why the string `id` exists at all: favorites/cart storage, PizzaCard
// links, etc. were all built around a string id ("p-01"). Rather than
// touching every one of those call sites, we keep producing that same
// string here, alongside the real numeric `dbId` for anything that needs
// to talk to Prisma again (e.g. the pizza details route).

import type { PizzaModel } from "@/generated/prisma/models/Pizza";

export type PizzaCategory =
  | "Classic"
  | "Signature"
  | "Spicy"
  | "Vegetarian"
  | "Desserts"
  | "Drinks";

export interface Pizza {
  id: string;
  dbId: number;
  name: string;
  description: string;
  ingredients: string[];
  category: PizzaCategory;
  price: number;
  rating: number;
  image: string;
  isPremium?: boolean;
  addedAt: number;
}

/** Builds the app-wide string id ("p-07") from a numeric database id. */
export function formatPizzaId(dbId: number): string {
  return `p-${String(dbId).padStart(2, "0")}`;
}

/**
 * Reverses formatPizzaId(). Returns null if the string isn't one of our
 * ids (e.g. a bad/unknown URL param), so callers can 404 instead of
 * querying Prisma with NaN.
 */
export function parsePizzaId(id: string): number | null {
  const match = /^p-(\d+)$/.exec(id);
  if (!match) return null;

  const dbId = Number(match[1]);
  return Number.isInteger(dbId) ? dbId : null;
}

/** Maps a raw Prisma Pizza row to the DTO every component expects. */
export function toPizzaDTO(pizza: PizzaModel): Pizza {
  return {
    id: formatPizzaId(pizza.id),
    dbId: pizza.id,
    name: pizza.name,
    description: pizza.description,
    ingredients: pizza.ingredients ?? [],
    category: pizza.category as PizzaCategory,
    price: pizza.price,
    rating: pizza.rating,
    image: pizza.image,
    isPremium: pizza.isPremium ?? false,
    addedAt: pizza.addedAt,
  };
}