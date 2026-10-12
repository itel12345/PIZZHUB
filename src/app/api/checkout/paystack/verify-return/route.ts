// src/app/api/checkout/paystack/verify-return/route.ts
//
// Handles exactly one gap the webhook-only architecture can't cover:
// a customer who cancels before ever attempting a charge produces NO
// charge.success or charge.failed event at all — there's nothing for
// Paystack to send a webhook about. Without this, that order sits
// PENDING forever with no automatic resolution path.
//
// Called once by the client when it lands on /order-success and finds
// the order still "pending" — actively asks Paystack what actually
// happened, instead of only waiting for a push that, for this specific
// case, will never arrive.
//
// Reuses verifyTransaction/confirmOnlinePayment/markOnlinePaymentFailed
// completely unchanged — same functions the webhook itself calls. This
// route's only job is to be a second, client-triggered caller of that
// same already-correct, already-idempotent logic. If the real webhook
// gets there first, this becomes a harmless no-op (findOwnedOrder
// below sees status is no longer "pending" and returns immediately
// without calling Paystack again).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { verifyTransaction } from "@/lib/paystack";
import { confirmOnlinePayment, markOnlinePaymentFailed, findOwnedOrder } from "@/lib/orders";

const bodySchema = z.object({ orderId: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    const body = await request.json();
    const result = bodySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { orderId } = result.data;

    // Ownership check — this is a real, client-triggered request (not
    // Paystack's own server calling in), so unlike the webhook itself,
    // this route must confirm the requesting user actually owns this
    // order before doing anything with it. Same IDOR-prevention
    // pattern used everywhere else in this app.
    const order = await findOwnedOrder(userId, orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.status !== "pending") {
      // Already resolved — by the real webhook, or an earlier call to
      // this same endpoint. Nothing to verify again; report current
      // state as-is rather than re-hitting Paystack's API needlessly.
      return NextResponse.json({ status: order.status }, { status: 200 });
    }

    const verified = await verifyTransaction(orderId);

    if (verified.status === "success") {
      const outcome = await confirmOnlinePayment(orderId, verified.amountKobo, verified.channel);
      const status = outcome.outcome === "amount-mismatch" ? "pending" : "confirmed";
      return NextResponse.json({ status }, { status: 200 });
    }

    // Anything that isn't "success" — abandoned, failed, or any other
    // Paystack status — is treated as not-paid. Never confirms, never
    // clears the cart; markOnlinePaymentFailed only transitions status,
    // exactly like the webhook's charge.failed branch already does.
    await markOnlinePaymentFailed(orderId);
    return NextResponse.json({ status: "cancelled" }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}