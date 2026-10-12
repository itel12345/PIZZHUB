// src/lib/paystack.ts
//
// Redirect flow (Paystack's "Standard" integration), not the inline
// popup: we initialize a transaction server-side, hand the browser a
// URL, Paystack hosts the actual payment form. Same shape as the
// Cloudinary upload flow — the sensitive step happens on a server we
// don't have to trust the client's word about, and the client-side
// public key that the inline/popup approach needs simply doesn't
// exist anywhere in this codebase, because this flow never needs one.

import "server-only";
import crypto from "crypto";
import { getPaystackSecretKey } from "./env";

const PAYSTACK_API_BASE = "https://api.paystack.co";

interface InitializeTransactionParams {
  email: string;
  amountKobo: number; // Paystack's smallest-unit convention (kobo, not cedis) — see amountToKobo() below
  reference: string;
  callbackUrl: string;
  /** Restricts which payment channels Paystack's hosted page offers —
   * e.g. ["card"] or ["mobile_money"] or both. This is the actual
   * enforcement point for Settings' Card/Mobile Money toggles: Paystack
   * itself will refuse to show a disabled channel, not just this app's
   * UI. Omit to let Paystack offer its full default channel set. */
  channels?: string[];
}

interface InitializeTransactionResult {
  authorizationUrl: string;
  reference: string;
}

/** GHS -> kobo (Paystack's base unit, same idea as cents). Pizza
 * prices in this schema are Float, not integer cents (a known,
 * documented pre-existing gap — see the ADR from the Products audit).
 * Rounding here is the boundary where that float imprecision gets
 * neutralized before it ever reaches a real payment processor —
 * Math.round is deliberate, not incidental. */
export function amountToKobo(amountGhs: number): number {
  return Math.round(amountGhs * 100);
}

export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<InitializeTransactionResult> {
  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      ...(params.channels ? { channels: params.channels } : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initialize payment.");
  }

  return {
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  };
}

export interface VerifiedTransaction {
  status: "success" | "failed" | "abandoned" | string;
  reference: string;
  amountKobo: number;
  currency: string;
  channel: string | undefined;
}

/**
 * Independent re-verification via Paystack's own API — this is the
 * second half of the "never trust one signal alone" rule. The webhook
 * arriving with a valid signature proves the message came from
 * Paystack; it does NOT by itself prove we're reading it correctly or
 * that nothing was replayed in a way the signature check wouldn't
 * catch. Calling verify with the reference asks Paystack directly,
 * server-to-server, "what actually happened for this transaction" —
 * the webhook payload is a trigger to check, not the final authority.
 */
export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const response = await fetch(
    `${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${getPaystackSecretKey()}` },
    }
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to verify transaction.");
  }

  return {
    status: data.data.status,
    reference: data.data.reference,
    amountKobo: data.data.amount,
    currency: data.data.currency,
    channel: data.data.channel,
  };
}

/**
 * Verifies a webhook request actually came from Paystack. MUST be
 * called with the raw request body string — not JSON.parse()'d and
 * re-stringified — because HMAC is computed over the exact bytes
 * Paystack sent. Re-serializing JSON can reorder keys or change
 * whitespace, which produces a different string and therefore a
 * different (non-matching) hash even though the "content" looks
 * identical. The route handler is responsible for reading
 * request.text() before ever calling request.json() or similar.
 */
export function isValidPaystackSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha512", getPaystackSecretKey())
    .update(rawBody)
    .digest("hex");

  // Timing-safe comparison — a plain === leaks how many leading bytes
  // matched via response-time differences, which is exactly the kind
  // of side channel signature verification exists to close.
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signatureHeader, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}