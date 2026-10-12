// src/app/api/checkout/route.ts
//
// Places an order from the signed-in user's SERVER cart. The request
// carries only delivery details and a payment method — never prices or
// items; createCodOrder / createOnlinePendingOrder re-derive everything
// from the stored cart, so a client cannot choose its own total.
//
// Two outcomes, deliberately different shapes:
//   cod  -> order is CONFIRMED and the cart cleared; returns the OrderDTO.
//   momo -> order is PENDING and nothing is cleared until a verified
//           Paystack webhook says so; returns { authorizationUrl, orderId }
//           for the client to navigate to.
//
// Paystack's webhook (paystack/webhook) and the cancelled-before-charge
// check (paystack/verify-return) are separate routes and must not be
// folded into this one.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validation/checkout";
import {
  createCodOrder,
  createOnlinePendingOrder,
  EmptyCartError,
  StoreClosedError,
  DeliveryUnavailableError,
  PaymentMethodDisabledError,
} from "@/lib/orders";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    const body = await request.json().catch(() => null);
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (result.data.paymentMethod === "momo") {
      // Paystack sends the customer back to this origin after payment.
      const { authorizationUrl, orderId } = await createOnlinePendingOrder(
        userId,
        result.data,
        request.nextUrl.origin
      );
      return NextResponse.json({ authorizationUrl, orderId }, { status: 200 });
    }

    const order = await createCodOrder(userId, result.data);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (error instanceof EmptyCartError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // The request was valid, but the store's current state (closed,
    // delivery off, payment channel off) doesn't allow it right now. The
    // messages are written for customers, so they are returned as-is.
    if (
      error instanceof StoreClosedError ||
      error instanceof DeliveryUnavailableError ||
      error instanceof PaymentMethodDisabledError
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}