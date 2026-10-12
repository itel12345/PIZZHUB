// src/lib/validation/adminOrder.ts
//
// Same shared-schema discipline as validation/product.ts and
// validation/checkout.ts — one definition, used by both the API route
// and (if ever needed) client-side checks, so the set of valid
// statuses can't drift between the two.

import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"], {
    message: "Choose a valid order status.",
  }),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
