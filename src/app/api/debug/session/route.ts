// src/app/api/debug/session/route.ts
//
// Temporary diagnostic route for debugging the admin auth chain.
// Reports what the SERVER actually sees — cookie presence, JWT
// validity, decoded role — without requiring you to guess from
// symptoms (redirected vs 500 vs stuck loading, etc).
//
// Locked to non-production on purpose: an endpoint that echoes back
// session/cookie state, even in sanitized form, is exactly the kind of
// thing that should never be reachable in a real deployment. Once
// you've confirmed login works, delete this file — it's a debugging
// tool, not a permanent part of the app.

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const diagnostics: Record<string, unknown> = {};

  diagnostics.jwtSecretConfigured = Boolean(process.env.JWT_SECRET?.trim());

  const store = await cookies();
  const cookie = store.get(ADMIN_SESSION_COOKIE);
  diagnostics.adminCookiePresent = Boolean(cookie?.value);

  if (!cookie?.value) {
    diagnostics.result = "NO_COOKIE";
    diagnostics.meaning =
      "The admin_session cookie was never set. This means login either " +
      "didn't run, or ran but your user's role wasn't 'ADMIN' at that " +
      "moment (check the DB value, then log out and log back in — the " +
      "role is only read once, at login time).";
    return NextResponse.json(diagnostics, { status: 200 });
  }

  if (!process.env.JWT_SECRET) {
    diagnostics.result = "NO_SECRET";
    diagnostics.meaning =
      "JWT_SECRET isn't set in this running process. Add it to .env and " +
      "restart the dev server — env changes don't hot-reload.";
    return NextResponse.json(diagnostics, { status: 200 });
  }

  try {
    const decoded = jwt.verify(cookie.value, process.env.JWT_SECRET);
    diagnostics.result = "VALID";
    diagnostics.decoded =
      typeof decoded === "object"
        ? { email: (decoded as Record<string, unknown>).email, role: (decoded as Record<string, unknown>).role }
        : null;
    diagnostics.meaning =
      (decoded as Record<string, unknown>)?.role === "ADMIN"
        ? "Everything checks out — this cookie should pass middleware. If /admin still redirects, the issue is likely a stale build/cache: hard-refresh, or restart the dev server."
        : "Cookie is valid but role isn't 'ADMIN' — something set this cookie without the right role, which shouldn't happen from the normal login route. Log out fully and log back in.";
  } catch (error) {
    diagnostics.result = "INVALID_OR_EXPIRED";
    diagnostics.meaning =
      "The cookie exists but doesn't verify against the current " +
      "JWT_SECRET — most likely JWT_SECRET changed since this cookie " +
      "was issued (log out and back in), or the cookie is expired " +
      "(8h TTL) and you just need to log in again.";
    diagnostics.errorName = error instanceof Error ? error.name : "unknown";
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
