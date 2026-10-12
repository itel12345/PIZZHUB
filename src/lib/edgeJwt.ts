// src/lib/edgeJwt.ts
//
// Next.js middleware runs on the Edge runtime, which doesn't have
// Node's `crypto` module — so the `jsonwebtoken` package the rest of
// the app uses (see src/lib/auth.ts, api/auth/login) can't run here.
// Rather than pull in a new dependency for one function, this verifies
// an HS256 JWT (exactly what jsonwebtoken produces) using the Web
// Crypto API, which IS available on the Edge runtime.
//
// This intentionally supports HS256 only — that's the only algorithm
// this codebase signs tokens with. If that ever changes, this needs to
// change with it.

interface VerifiedPayload {
  [key: string]: unknown;
  exp?: number;
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlToJson<T>(base64Url: string): T {
  const bytes = base64UrlToUint8Array(base64Url);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

/**
 * Verifies an HS256-signed JWT's signature and expiry.
 * Returns the decoded payload, or null if the token is missing,
 * malformed, unsigned by this secret, or expired.
 */
export async function verifyEdgeJwt(
  token: string | undefined | null,
  secret: string
): Promise<VerifiedPayload | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const header = base64UrlToJson<{ alg?: string }>(headerB64);
    if (header.alg !== "HS256") return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signature = base64UrlToUint8Array(signatureB64);
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature as BufferSource,
      data as BufferSource
    );
    if (!valid) return null;

    const payload = base64UrlToJson<VerifiedPayload>(payloadB64);
    if (typeof payload.exp === "number" && Date.now() / 1000 >= payload.exp) {
      return null; // expired
    }

    return payload;
  } catch {
    return null;
  }
}