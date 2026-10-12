// src/components/admin/products/types.ts
//
// Shared shape for the Add/Edit pizza form. Kept separate from
// src/lib/pizza.ts's `Pizza` DTO because a form deals in "values about
// to be saved" (no id, no dbId), not "a row that already exists."

import type { PizzaCategory } from "@/lib/pizza";

export interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  image: string;
  category: PizzaCategory;
  rating: number;
  ingredients: string[];
  isPremium: boolean;
}

export const CATEGORY_OPTIONS: PizzaCategory[] = [
  "Classic",
  "Signature",
  "Spicy",
  "Vegetarian",
  "Desserts",
  "Drinks",
];