// src/app/api/checkout/paystack/webhook/route.ts
//
// This is the ONLY code path in the entire app that can mark an online
// order CONFIRMED. Not /api/checkout (that only ever creates PENDING),
// not the client redirecting back to /order-success (that's just a
// browser landing on a URL — zero authority). Paystack calls this
// directly, server-to-server; the user's browser is never involved in
// this request at all.
//
// Deliberately NOT behind requireUser() — Paystack isn't a logged-in
// PizzHub user and has no session token to send. Security here comes
// entirely from the HMAC signature check below, not from auth
// middleware. This route also isn't under /api/admin/*, so
// middleware.ts's matcher doesn't touch it either way — confirmed
// deliberately, not just assumed.
//
// Every step here is defense-in-depth on top of the last:
//   1. Signature check  -> proves this request really came from Paystack
//   2. Independent verify -> proves what Paystack's system actually
//      recorded, not just what this one message claims
//   3. Amount comparison  -> proves what was verified matches what we
//      billed, not just that *something* was paid
//   4. Atomic conditional update -> proves this exact webhook can't
//      double-process, even under retries or concurrent delivery
// Skipping any one of these would make the other three alone
// insufficient — this isn't redundancy, each step closes a gap the
// others don't.

import { NextRequest, NextResponse } from "next/server";
import {
  isValidPaystackSignature,
  verifyTransaction,
} from "@/lib/paystack";
import { confirmOnlinePayment, markOnlinePaymentFailed } from "@/lib/orders";

export async function POST(request: NextRequest) {
  // Raw text, not request.json() — signature verification requires
  // the exact bytes Paystack sent. Parsing and re-serializing JSON can
  // reorder keys or alter whitespace, which would change the string
  // and invalidate a signature that was actually valid.
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!isValidPaystackSignature(rawBody, signature)) {
    // Not logged as an error — Paystack's own IP allowlist docs note
    // occasional probing/scanning traffic hits public webhook URLs.
    // An invalid signature is expected noise, not an incident, unless
    // it happens at volume (which would be a separate, infra-level
    // concern — rate limiting this endpoint, not application logic).
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: { event?: string; data?: { reference?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const reference = payload.data?.reference;
  if (!reference) {
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  }

  try {
    if (payload.event === "charge.success") {
      // Independent re-verification — never trust the webhook body's
      // own claim of success, even though its signature checked out.
      // The signature proves authenticity of the message; it doesn't
      // by itself re-derive the true current state from Paystack's
      // system of record.
      const verified = await verifyTransaction(reference);

      if (verified.status !== "success") {
        // Paystack sent a success event but their own verify endpoint
        // now disagrees (e.g. a subsequent reversal) — treat as not
        // confirmed rather than trusting the webhook payload alone.
        await markOnlinePaymentFailed(reference);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const result = await confirmOnlinePayment(
        reference,
        verified.amountKobo,
        verified.channel
      );

      if (result.outcome === "amount-mismatch") {
        // Logged loudly inside confirmOnlinePayment already. Still
        // acknowledge the webhook (200) so Paystack stops retrying a
        // message that will never resolve automatically — this needs
        // human review, not an automated retry loop.
        return NextResponse.json({ received: true }, { status: 200 });
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (payload.event === "charge.failed") {
      await markOnlinePaymentFailed(reference);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Any other event type (e.g. transfer events, subscription
    // events) — acknowledge and ignore. This webhook URL only cares
    // about charge outcomes; returning 200 for events we don't act on
    // is correct, not a missed case, since Paystack sends every event
    // type to every configured webhook URL by default.
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Paystack webhook processing error:", error);
    // Non-2xx here is intentional, unlike every branch above: this is
    // an actual unexpected failure (e.g. Paystack's verify API itself
    // being unreachable), and returning 500 lets Paystack's built-in
    // retry mechanism attempt delivery again later — which is safe
    // specifically because confirmOnlinePayment/markOnlinePaymentFailed
    // are idempotent, so a retried delivery can't double-process even
    // if this exact request had partially succeeded before failing.
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}