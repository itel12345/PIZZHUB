// src/lib/origin.ts
//
// CSRF defence, second layer behind SameSite=Lax cookies: every
// state-changing API request must come from this site's own origin.
// Pure function (no Next/Prisma imports) so the proxy and the tests can
// both use it.
//
// Deliberately fails CLOSED: a mutating request with neither a matching
// Origin nor a same-origin Sec-Fetch-Site is rejected. Every browser
// that can run this app sends one of them on fetch() POST/PATCH/DELETE.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Server-to-server endpoints that cannot carry a browser Origin. Each
 * must authenticate the caller itself. The Paystack webhook does: it
 * verifies the HMAC signature of the raw body (see that route) and uses
 * no cookies, so there is no ambient credential for CSRF to ride on.
 */
const EXEMPT_PATHS = new Set(["/api/checkout/paystack/webhook"]);

export interface OriginCheckInput {
  method: string;
  pathname: string;
  origin: string | null;
  secFetchSite: string | null;
  host: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  /** Extra canonical origins, e.g. from APP_URL. */
  allowedOrigins?: string[];
}

export type OriginCheckResult = { ok: true } | { ok: false; reason: string };

function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function isOriginCheckExempt(pathname: string): boolean {
  return EXEMPT_PATHS.has(normalizePath(pathname));
}

function firstValue(header: string | null | undefined): string | null {
  if (!header) return null;
  const first = header.split(",")[0]?.trim();
  return first ? first : null;
}

export function checkRequestOrigin(input: OriginCheckInput): OriginCheckResult {
  if (SAFE_METHODS.has(input.method.toUpperCase())) return { ok: true };
  if (isOriginCheckExempt(input.pathname)) return { ok: true };

  const allowedHosts = new Set<string>();
  const host = firstValue(input.host);
  const fwdHost = firstValue(input.forwardedHost);
  if (host) allowedHosts.add(host.toLowerCase());
  if (fwdHost) allowedHosts.add(fwdHost.toLowerCase());

  const allowedOrigins = new Set<string>();
  for (const o of input.allowedOrigins ?? []) {
    try {
      allowedOrigins.add(new URL(o).origin.toLowerCase());
    } catch {
      /* ignore malformed config entries */
    }
  }

  if (input.origin !== null && input.origin !== "") {
    let parsed: URL;
    try {
      parsed = new URL(input.origin);
    } catch {
      return { ok: false, reason: "Malformed Origin header." };
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, reason: "Unsupported Origin scheme." };
    }
    const proto = firstValue(input.forwardedProto);
    if (proto && parsed.protocol !== `${proto.toLowerCase()}:`) {
      return { ok: false, reason: "Origin scheme does not match the request." };
    }
    if (
      allowedOrigins.has(parsed.origin.toLowerCase()) ||
      allowedHosts.has(parsed.host.toLowerCase())
    ) {
      return { ok: true };
    }
    return { ok: false, reason: "Cross-origin request blocked." };
  }

  // No Origin header: trust only the browser's own same-origin signal.
  const site = input.secFetchSite?.toLowerCase();
  if (site === "same-origin" || site === "none") return { ok: true };

  return { ok: false, reason: "Missing Origin on a state-changing request." };
}

export function allowedOriginsFromEnv(): string[] {
  const out: string[] = [];
  if (process.env.APP_URL) out.push(process.env.APP_URL);
  if (process.env.ALLOWED_ORIGINS) {
    out.push(...process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean));
  }
  return out;
}
