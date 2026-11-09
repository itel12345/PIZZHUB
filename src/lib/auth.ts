// src/lib/auth.ts
//
// Server-only. The single entry point every protected route uses.
//
// Sessions are database-backed (lib/session.ts): an HttpOnly cookie holds
// a random secret, the database holds its hash, and the user's CURRENT
// role and account state are read on every request. That replaces the
// previous two mechanisms (a localStorage Bearer JWT for customers and a
// separate 8-hour admin JWT cookie), neither of which could be revoked
// by logging out or reflect a role change before it expired.
//
// The exported names and the requireUser(request) / requireAdmin()
// signatures are unchanged, so no route needs to be rewritten.

import "server-only";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, ADMIN_SESSION_COOKIE } from "./authConstants";
import {
  validateSessionToken,
  SESSION_LIMITS,
  type ValidSession,
} from "./session";
import { checkRequestOrigin, allowedOriginsFromEnv } from "./origin";

// Re-exported so existing `import { ADMIN_SESSION_COOKIE } from "@/lib/auth"`
// keeps compiling. It is a LEGACY name; nothing reads that cookie any more.
export { ADMIN_SESSION_COOKIE };

export interface AdminSessionPayload {
  userId: string;
  email: string;
  role: "ADMIN";
  /** Added in the session rewrite; lets a password change keep THIS session. */
  sessionId?: string;
}

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Pure admin policy, exported for tests: must currently hold the ADMIN
 * role (read from the database a moment ago) and the session must be
 * younger than the admin hard cap. A stale-but-valid customer session
 * belonging to a newly promoted admin therefore asks for a fresh login.
 */
export function authorizeAdminSession(
  session: ValidSession | null,
  now: Date = new Date()
): AdminSessionPayload {
  if (!session) throw new AuthError(401, "Not authenticated.");
  if (now.getTime() - session.createdAt.getTime() >= SESSION_LIMITS.adminAbsoluteMs) {
    throw new AuthError(401, "Not authenticated.");
  }
  if (session.user.role !== "ADMIN") {
    throw new AuthError(403, "You don't have access to this resource.");
  }
  return {
    userId: session.user.id,
    email: session.user.email,
    role: "ADMIN",
    sessionId: session.sessionId,
  };
}

/**
 * Call at the top of every /api/admin/** route handler. Throws
 * AuthError if the caller isn't an authenticated admin right now.
 */
export async function requireAdmin(): Promise<AdminSessionPayload> {
  const store = await cookies();
  const session = await validateSessionToken(store.get(SESSION_COOKIE)?.value);
  return authorizeAdminSession(session);
}

/**
 * For admin server components/layouts: returns null instead of throwing,
 * since a page deciding to redirect isn't an error condition.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

/** Standard shape for every 401/403 an admin route returns. Never
 * leaks *why* beyond "not authenticated" / "not authorized". */
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

export interface UserSessionPayload {
  userId: string;
  /** Added in the session rewrite; lets a password change keep THIS session. */
  sessionId: string;
}

/**
 * Call at the top of every authenticated customer route. Reads the
 * session cookie (never an Authorization header: a script-readable
 * credential is exactly what this rewrite removed), re-checks the
 * account against the database, and, for state-changing methods,
 * re-verifies the request's Origin as a second CSRF layer behind the
 * proxy's global check.
 */
export async function requireUser(request: NextRequest): Promise<UserSessionPayload> {
  const origin = checkRequestOrigin({
    method: request.method,
    pathname: request.nextUrl.pathname,
    origin: request.headers.get("origin"),
    secFetchSite: request.headers.get("sec-fetch-site"),
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    allowedOrigins: allowedOriginsFromEnv(),
  });
  if (!origin.ok) {
    throw new AuthError(403, "You don't have access to this resource.");
  }

  const session = await validateSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) throw new AuthError(401, "Not authenticated.");

  return { userId: session.user.id, sessionId: session.sessionId };
}
