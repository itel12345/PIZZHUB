// src/lib/rate-limit.ts
//
// Server-only. Fixed-window abuse counters stored in Postgres, so the
// limits hold across serverless instances (an in-memory Map would give
// every instance its own empty counter). Each hit is ONE atomic
// INSERT ... ON CONFLICT statement: no read-then-write race.
//
// Keys are SHA-256(action:identifier) so raw emails and IP addresses are
// never stored.

import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "./prisma";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterSeconds: number;
}

export const LIMITS = {
  loginPerIp: { limit: 20, windowSeconds: 15 * 60 },
  loginPerEmail: { limit: 5, windowSeconds: 15 * 60 },
  signupPerIp: { limit: 10, windowSeconds: 60 * 60 },
  forgotPerIp: { limit: 5, windowSeconds: 60 * 60 },
  forgotPerEmail: { limit: 3, windowSeconds: 60 * 60 },
  resendPerIp: { limit: 5, windowSeconds: 60 * 60 },
  resendPerEmail: { limit: 3, windowSeconds: 60 * 60 },
  tokenActionPerIp: { limit: 20, windowSeconds: 60 * 60 },
} as const;

export function rateLimitKey(action: string, identifier: string): string {
  return createHash("sha256")
    .update(`${action}:${identifier.trim().toLowerCase()}`)
    .digest("hex");
}

export async function consumeRateLimit(
  action: string,
  identifier: string,
  rule: { limit: number; windowSeconds: number },
  now: Date = new Date()
): Promise<RateLimitResult> {
  const key = rateLimitKey(action, identifier);
  const iso = now.toISOString();

  const rows = await prisma.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, (${iso}::timestamptz AT TIME ZONE 'UTC'))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" <= (${iso}::timestamptz AT TIME ZONE 'UTC') - make_interval(secs => ${rule.windowSeconds}::double precision)
        THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" <= (${iso}::timestamptz AT TIME ZONE 'UTC') - make_interval(secs => ${rule.windowSeconds}::double precision)
        THEN (${iso}::timestamptz AT TIME ZONE 'UTC') ELSE "RateLimit"."windowStart" END
    RETURNING "count", "windowStart"`;

  const row = rows[0];
  const count = Number(row.count);
  const windowEnd = new Date(row.windowStart).getTime() + rule.windowSeconds * 1000;
  // `windowStart` comes back as a UTC-naive timestamp; Prisma maps it as UTC.
  const retryAfterSeconds = Math.max(1, Math.ceil((windowEnd - now.getTime()) / 1000));

  return {
    allowed: count <= rule.limit,
    count,
    limit: rule.limit,
    retryAfterSeconds,
  };
}

/** Forget a counter (e.g. clear the per-email login counter after a successful login). */
export async function resetRateLimit(action: string, identifier: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key: rateLimitKey(action, identifier) } });
}

/**
 * Best-effort client IP. The first X-Forwarded-For entry is only
 * trustworthy when the host's proxy sets/overwrites that header (Vercel,
 * Netlify, Cloudflare do). Per-email limits do not depend on it, which
 * is why both are applied.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** Standard 429 body + header values. */
export function tooManyRequests(retryAfterSeconds: number) {
  return {
    status: 429 as const,
    headers: { "Retry-After": String(retryAfterSeconds) },
    body: { error: "Too many attempts. Please wait a while and try again." },
  };
}
