// src/lib/auth-client.ts
//
// Browser-side helpers for the email-based auth flows. They call the REAL
// endpoints and translate every outcome into one small, predictable shape
// the forms and pages can render. Kept free of React and of any
// server-only import so it can be unit-tested in Node.
//
// Nothing here pretends success: a form only reaches its success state
// when the server answered 2xx.

export type ApiFailureKind =
  | "invalid_link" // token malformed/expired/used (server code INVALID_TOKEN)
  | "invalid_input" // e.g. password rules
  | "rate_limited"
  | "unavailable" // e.g. email delivery not configured (503)
  | "network"
  | "unknown";

export type ApiResult =
  | { ok: true; message: string }
  | { ok: false; kind: ApiFailureKind; message: string; retryAfterSeconds?: number };

export const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";
export const UNKNOWN_MESSAGE = "Something went wrong. Please try again.";
export const RATE_LIMIT_MESSAGE =
  "Too many attempts. Please wait a while and try again.";

/** Server code returned by POST /api/auth/login for an unverified account. */
export const EMAIL_NOT_VERIFIED_CODE = "EMAIL_NOT_VERIFIED";

const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores everything past 72 bytes

/** Same rules the server enforces; for instant feedback only. */
export function validateNewPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return "That password is too long (72 bytes maximum).";
  }
  return null;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

async function postJson(url: string, body: unknown): Promise<ApiResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, kind: "network", message: NETWORK_MESSAGE };
  }

  let data: { message?: unknown; error?: unknown; code?: unknown } = {};
  try {
    data = await response.json();
  } catch {
    // Non-JSON body (e.g. an HTML error page): fall through to generic text.
  }

  if (response.ok) {
    return { ok: true, message: text(data.message, "") };
  }

  if (response.status === 429) {
    const retry = Number(response.headers.get("retry-after"));
    return {
      ok: false,
      kind: "rate_limited",
      message: text(data.error, RATE_LIMIT_MESSAGE),
      retryAfterSeconds: Number.isFinite(retry) && retry > 0 ? retry : undefined,
    };
  }
  if (response.status === 503) {
    return { ok: false, kind: "unavailable", message: text(data.error, UNKNOWN_MESSAGE) };
  }
  if (response.status === 400) {
    return {
      ok: false,
      kind: data.code === "INVALID_TOKEN" ? "invalid_link" : "invalid_input",
      message: text(data.error, UNKNOWN_MESSAGE),
    };
  }
  return { ok: false, kind: "unknown", message: UNKNOWN_MESSAGE };
}

export function requestPasswordReset(email: string): Promise<ApiResult> {
  return postJson("/api/auth/forgot-password", { email });
}

export function resendVerificationEmail(email: string): Promise<ApiResult> {
  return postJson("/api/auth/resend-verification", { email });
}

export function confirmEmail(token: string): Promise<ApiResult> {
  return postJson("/api/auth/verify-email", { token });
}

export function resetPassword(token: string, password: string): Promise<ApiResult> {
  return postJson("/api/auth/reset-password", { token, password });
}
