// src/lib/validation/address.ts
//
// Field constraints copied exactly from lib/validation/checkout.ts's
// address fields — a saved address isn't a new concept with its own
// rules, it's a reusable copy of the same address Checkout already
// validates fresh every time.

import { z } from "zod";

export const addressInputSchema = z.object({
  label: z.string().trim().min(1, "Please give this address a label.").max(50).default("Home"),
  fullName: z.string().trim().min(2, "Please enter a full name.").max(100),
  phone: z.string().trim().min(7, "Please enter a valid phone number.").max(20),

  street: z.string().trim().min(3, "Please enter a street address.").max(200),
  city: z.string().trim().min(2, "Please enter a city.").max(100),
  region: z.string().trim().min(2, "Please enter a region or state.").max(100),
  postalCode: z.string().trim().max(20).optional().default(""),
  deliveryInstructions: z.string().trim().max(500).optional().default(""),

  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressInputSchema>;

// Same shape, but every field optional — PATCH accepts a partial
// update, same convention as lib/validation/adminSettings.ts.
export const addressUpdateSchema = addressInputSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields were provided to update.",
  });

export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;