// src/lib/session.ts
//
// Server-only. Database-backed sessions.
//
// The browser holds a random 256-bit secret in an HttpOnly cookie. The
// database holds only its SHA-256 hash, so a database leak cannot be
// replayed as live logins. A SHA-256 (rather than a slow password hash)
// is correct here: the secret already has 256 bits of entropy, so there
// is nothing to brute-force, and every request has to pay this cost.
//
// Revocation is deleting the row. Role and account state are read from
// the User row on EVERY validation, never copied into the session, so a
// demotion or an account deletion takes effect on the very next request.

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { SESSION_COOKIE, ADMIN_SESSION_COOKIE } from "./authConstants";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const SESSION_LIMITS = {
  /** Signed out after this long without activity. */
  customerIdleMs: 14 * DAY,
  /** Signed out this long after login no matter how active. */
  customerAbsoluteMs: 30 * DAY,
  /** Admins: short, hard cap (same 8h the old admin cookie had). */
  adminAbsoluteMs: 8 * HOUR,
  /** lastUsedAt/expiresAt are refreshed at most this often (write throttle). */
  touchIntervalMs: 5 * MINUTE,
} as const;

/** Anonymised (deleted) accounts get this email domain, see lib/account.ts. */
const DELETED_ACCOUNT_DOMAIN = "@deleted.invalid";

// 32 random bytes in base64url = exactly 43 characters.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function looksLikeToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  image: string | null;
  emailVerifiedAt: Date | null;
}

export interface ValidSession {
  sessionId: string;
  createdAt: Date;
  user: SessionUser;
}

function sessionExpiry(createdAt: Date, now: Date): Date {
  const idleEnd = now.getTime() + SESSION_LIMITS.customerIdleMs;
  const absoluteEnd = createdAt.getTime() + SESSION_LIMITS.customerAbsoluteMs;
  return new Date(Math.min(idleEnd, absoluteEnd));
}

/** Creates a session for a user who has JUST authenticated. */
export async function createSession(
  userId: string,
  opts: { userAgent?: string | null; now?: Date } = {}
): Promise<{ token: string; expiresAt: Date; sessionId: string }> {
  const now = opts.now ?? new Date();
  const token = generateToken();
  const expiresAt = sessionExpiry(now, now);

  const row = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
      userAgent: opts.userAgent ? opts.userAgent.slice(0, 255) : null,
    },
    select: { id: true },
  });

  return { token, expiresAt, sessionId: row.id };
}

/**
 * Resolves a cookie value to a live session plus the CURRENT user, or
 * null. Every failure mode returns the same null (callers answer with a
 * generic 401), so nothing here reveals why a token was rejected.
 */
export async function validateSessionToken(
  token: string | undefined | null,
  now: Date = new Date()
): Promise<ValidSession | null> {
  if (!looksLikeToken(token)) return null;

  const row = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          emailVerifiedAt: true,
        },
      },
    },
  });
  if (!row) return null;

  const absoluteEnd = row.createdAt.getTime() + SESSION_LIMITS.customerAbsoluteMs;
  if (row.expiresAt.getTime() <= now.getTime() || absoluteEnd <= now.getTime()) {
    // Expired: remove it so the table does not accumulate dead rows.
    await prisma.session.deleteMany({ where: { id: row.id } });
    return null;
  }

  // Account state is checked against the live row on every request.
  if (row.user.email.endsWith(DELETED_ACCOUNT_DOMAIN)) {
    await prisma.session.deleteMany({ where: { id: row.id } });
    return null;
  }

  // Sliding idle window, written at most every few minutes.
  if (now.getTime() - row.lastUsedAt.getTime() >= SESSION_LIMITS.touchIntervalMs) {
    await prisma.session.update({
      where: { id: row.id },
      data: { lastUsedAt: now, expiresAt: sessionExpiry(row.createdAt, now) },
    });
  }

  return {
    sessionId: row.id,
    createdAt: row.createdAt,
    user: row.user as SessionUser,
  };
}

/** Logout. Idempotent: an unknown or malformed token is simply a no-op. */
export async function revokeSessionByToken(
  token: string | undefined | null
): Promise<void> {
  if (!looksLikeToken(token)) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/**
 * Signs a user out everywhere. Pass the caller's own session id to keep
 * that one alive (used after a password change so the person who just
 * changed it is not logged out by their own action).
 */
export async function revokeAllSessionsForUser(
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
  });
  return result.count;
}

/** Housekeeping: drops expired sessions and used/expired tokens. */
export async function pruneExpiredAuthRows(now: Date = new Date()): Promise<void> {
  await prisma.session.deleteMany({ where: { expiresAt: { lte: now } } });
  await prisma.authToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lte: now } },
        { usedAt: { not: null, lte: new Date(now.getTime() - DAY) } },
      ],
    },
  });
  await prisma.rateLimit.deleteMany({
    where: { windowStart: { lte: new Date(now.getTime() - 2 * DAY) } },
  });
}

// ── cookie helpers ───────────────────────────────────────────────

export function setSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date
): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax: sent on normal same-site navigation, not on cross-site
    // POST/PATCH/DELETE. Origin checking (lib/origin.ts) is the second layer.
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  } as const;
  response.cookies.set(SESSION_COOKIE, "", { ...expired, sameSite: "lax" });
  // Also expire the legacy admin JWT cookie if a browser still has one.
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...expired, sameSite: "strict" });
}
