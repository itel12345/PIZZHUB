// src/lib/auth.ts
//
// Server-only. Verifies the HttpOnly `admin_session` cookie set by
// /api/auth/login and confirms the caller is role=ADMIN before any
// /api/admin/* route touches the database.
//
// Cookie, not Authorization header: the existing customer-facing auth
// (localStorage + Bearer token) can't be read by server components or
// by middleware, so it can't actually gate anything server-side — it's
// decorative for that purpose. The admin cookie is additive: it's set
// alongside the existing token response only when the logging-in user
// is an admin, and doesn't change how customer auth works anywhere
// else in the app.

import "server-only";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getJwtSecret } from "./env";
import { prisma } from "./prisma";
import { ADMIN_SESSION_COOKIE } from "./authConstants";

// Re-exported (not redefined) so existing imports from "@/lib/auth"
// keep working. The definition lives in authConstants.ts specifically
// so middleware.ts can import it WITHOUT loading this file — this file
// imports Prisma, which cannot be bundled for the Edge runtime.
export { ADMIN_SESSION_COOKIE };

export interface AdminSessionPayload {
  userId: string;
  email: string;
  role: "ADMIN";
}

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function decodeAdminToken(token: string | undefined): AdminSessionPayload {
  if (!token) {
    throw new AuthError(401, "Not authenticated.");
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch {
    throw new AuthError(401, "Not authenticated.");
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    (decoded as Record<string, unknown>).role !== "ADMIN"
  ) {
    throw new AuthError(403, "You don't have access to this resource.");
  }

  return decoded as AdminSessionPayload;
}

/**
 * Call at the top of every /api/admin/** route handler. Throws
 * AuthError (catch it and return the generic 401/403 JSON below) if
 * the caller isn't an authenticated admin.
 */
export async function requireAdmin(): Promise<AdminSessionPayload> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  return decodeAdminToken(token);
}

/**
 * Call from admin server components/layouts to decide whether to
 * render or redirect. Never throws — returns null instead, since a
 * page deciding to redirect isn't an error condition.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

/** Standard shape for every 401/403 an admin route returns. Never
 * leaks *why* beyond "not authenticated" / "not authorized" — no stack
 * traces, no "user not found" vs "wrong role" distinction. */
export function authErrorResponse(error: AuthError) {
  return {
    status: error.status,
    body: {
      error:
        error.status === 401
          ? "Not authenticated."
          : "You don't have access to this resource.",
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// Customer (non-admin) session verification.
//
// Deliberately a different mechanism from requireAdmin(): customer
// auth in this app is Bearer-token-in-localStorage (see AuthContext),
// not the HttpOnly cookie admin sessions use. That's an existing,
// app-wide convention (predates this file — see the original
// /api/cart/route.ts) — requireUser() centralizes what was previously
// duplicated ad-hoc per-route, it doesn't change the mechanism.
//
// This is genuinely a different, weaker guarantee than the admin
// cookie: a Bearer token in localStorage is readable by any script
// that can run on the page (XSS), same caveat that already applied to
// every customer-facing route before this file existed. Not a new
// regression introduced here — flagged in the audit as an existing,
// broader auth-system limitation outside the Cart module's scope.
export interface UserSessionPayload {
  userId: string;
}

/**
 * Signs a customer JWT with the given authVersion baked in. The ONLY
 * two callers of this are /api/auth/login (issuing a session for the
 * first time) and lib/account.ts's changeUserPassword (re-issuing a
 * session immediately after bumping authVersion — see the long
 * comment on requireUser() below for why that re-issue is required,
 * not optional: without it, the very request that just changed the
 * password would invalidate its own token on its next call).
 */
export function issueUserToken(user: {
  id: string;
  email: string;
  authVersion: number;
}): string {
  return jwt.sign(
    { userId: user.id, email: user.email, authVersion: user.authVersion },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

// The JWT's own claims, before anything has been checked against the
// database. `authVersion` is what makes revocation possible at all —
// see the long comment below.
interface DecodedUserToken {
  userId: string;
  authVersion: number;
}

function decodeUserToken(token: string | undefined | null): DecodedUserToken {
  if (!token) {
    throw new AuthError(401, "Not authenticated.");
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch {
    throw new AuthError(401, "Not authenticated.");
  }

  if (typeof decoded !== "object" || decoded === null) {
    throw new AuthError(401, "Not authenticated.");
  }

  const { userId, authVersion } = decoded as Record<string, unknown>;

  if (typeof userId !== "string") {
    throw new AuthError(401, "Not authenticated.");
  }

  // No `authVersion` claim at all means this token was issued before
  // that claim existed (i.e. before this security fix shipped).
  // Deliberately NOT treated as "assume version 0" — a token that
  // omits the claim gets rejected outright, the same as one that fails
  // signature verification. Defaulting a missing claim to a specific
  // number is exactly the kind of thing a forged/replayed token could
  // exploit by omitting the field on purpose; failing closed avoids
  // that question entirely. Practical effect: every session issued
  // before this change stops working the moment this ships, and
  // everyone has to log in again once — a one-time cost, not an
  // ongoing one.
  if (typeof authVersion !== "number") {
    throw new AuthError(401, "Not authenticated.");
  }

  return { userId, authVersion };
}

// ─────────────────────────────────────────────────────────────────
// Why this exists: jwt.verify() above only proves the token was
// signed by this server and hasn't expired — it says nothing about
// whether the account it names should still be trusted *right now*.
// A verified-but-stale JWT is indistinguishable from a legitimate one
// by signature alone, so anything that can only check the signature
// (which is all requireUser() used to do) has no way to revoke a
// token early: password changes, account deletion, and "log out
// everywhere" would all be purely cosmetic on the client, with the
// old token quietly continuing to work against every API route until
// its 7-day expiry.
//
// `User.authVersion` (see prisma/schema.prisma) is the fix: a counter
// that only moves forward, bumped exactly when every outstanding
// session for that account must stop working (currently: password
// change, account deletion). Every token embeds the authVersion it
// was issued with; requireUser() re-reads the CURRENT value from the
// database on every request and rejects the request the instant the
// two no longer match — turning "the signature checks out" into "the
// signature checks out AND nothing has invalidated this session
// since it was issued."
//
// This is a real database read on every authenticated request (not a
// free check), which is the correct trade-off here: session
// revocation is a security property, not a performance one, and
// there is no way to get it from signature verification alone.
/** Call at the top of every authenticated (non-admin) customer route. */
export async function requireUser(request: NextRequest): Promise<UserSessionPayload> {
  const token = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  const decoded = decodeUserToken(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { authVersion: true },
  });

  // Covers both "the account no longer exists" and, structurally,
  // "authVersion no longer matches" below — either way, this token no
  // longer speaks for a real, currently-valid session, and the caller
  // never learns which case it was (same generic 401 either way).
  if (!user || user.authVersion !== decoded.authVersion) {
    throw new AuthError(401, "Not authenticated.");
  }

  return { userId: decoded.userId };
}