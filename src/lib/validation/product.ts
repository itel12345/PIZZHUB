// src/lib/validation/product.ts
//
// Single source of truth for "is this a valid pizza". Both ProductForm
// (client-side, instant feedback) and the /api/admin/products routes
// (server-side, authoritative) parse against this exact schema — so
// the two can never quietly drift apart the way two hand-rolled
// validation blocks eventually do.
//
// The backend is still the source of truth: the API routes re-run this
// schema themselves rather than trusting whatever the client claims it
// validated. The client-side use of this schema is purely UX (fail
// fast, show the same message the server would).

import { z } from "zod";
import { CATEGORY_OPTIONS } from "@/components/admin/products/types";

// Money note: `price` is stored as Postgres `Float` today (pre-existing
// schema, shared with Cart/Checkout — out of scope to change from this
// module alone). We can't make it a true integer-cents column without
// touching those modules, but we *can* stop float drift at the door by
// rejecting anything with sub-cent precision, which is what this refine
// does. See ADR-0001 in the audit notes for the real fix.
const money = z
  .number({ message: "Price must be a number." })
  .finite("Price must be a finite number.")
  .positive("Price must be greater than 0.")
  .max(10_000, "Price seems unrealistically high — double check it.")
  .refine(
    (value) => Math.round(value * 100) === value * 100,
    "Price can't have more than 2 decimal places."
  );

export const productInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(500, "Description must be 500 characters or fewer."),
  price: money,
  image: z
    .string()
    .trim()
    .url("Image must be a valid URL.")
    .max(2048, "Image URL is too long."),
  category: z.enum(CATEGORY_OPTIONS as [string, ...string[]], {
    message: "Choose a valid category.",
  }),
  rating: z
    .number({ message: "Rating must be a number." })
    .finite()
    .min(0, "Rating must be between 0 and 5.")
    .max(5, "Rating must be between 0 and 5."),
  ingredients: z
    .array(z.string().trim().min(1).max(40))
    .min(1, "Add at least one ingredient.")
    .max(25, "That's a lot of ingredients — keep it to 25 or fewer.")
    .transform((items) => {
      // De-dupe case-insensitively so "Basil" and "basil" don't both
      // slip through as separate ingredients.
      const seen = new Set<string>();
      return items.filter((item) => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }),
  isPremium: z.boolean(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

/** Flattens a Zod error into one message per field, for form UIs. */
export function flattenProductErrors(
  error: z.ZodError
): Partial<Record<keyof ProductInput, string>> {
  const out: Partial<Record<keyof ProductInput, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof ProductInput | undefined;
    if (key && !out[key]) {
      out[key] = issue.message;
    }
  }
  return out;
}
