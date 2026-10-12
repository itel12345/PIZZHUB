// src/lib/validation/checkout.ts
//
// Field names deliberately mirror CustomerInformationValues +
// DeliveryAddressValues exactly (see those components) — this schema
// validates the same shape CheckoutPage already collects, it doesn't
// invent a new one. paymentMethod accepts the full set the UI can
// currently submit ("cod" | "momo") — restricting to COD-only is
// business logic (a 400 with a clear message), not a shape/validation
// concern, so it happens in the route handler, not here.

import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.string().trim().email("Please enter a valid email.").max(200).or(z.literal("")),
  phone: z.string().trim().min(7, "Please enter a valid phone number.").max(20),

  street: z.string().trim().min(3, "Please enter your street address.").max(200),
  city: z.string().trim().min(2, "Please enter your city.").max(100),
  region: z.string().trim().min(2, "Please enter your region or state.").max(100),
  postalCode: z.string().trim().max(20).optional().default(""),
  deliveryInstructions: z.string().trim().max(500).optional().default(""),

  deliveryMethod: z.enum(["standard", "express", "pickup"], {
    message: "Please choose a delivery method.",
  }),
  paymentMethod: z.enum(["cod", "momo"], {
    message: "Please choose a payment method.",
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;