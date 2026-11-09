// src/app/api/auth/logout/route.ts
//
// Logout destroys the session ON THE SERVER: the row is deleted, so the
// cookie value stops working everywhere immediately, even if a copy of
// it was captured. It also expires the cookie in this browser (and any
// stale legacy admin cookie). Idempotent: logging out with no or an
// invalid session still answers 200.

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/authConstants";
import { revokeSessionByToken, clearSessionCookies } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    await revokeSessionByToken(request.cookies.get(SESSION_COOKIE)?.value);
  } catch (error) {
    // Still clear the cookie below; the row will lapse by expiry. Surface
    // the failure honestly instead of pretending everything was revoked.
    console.error("logout: session revoke failed:", error instanceof Error ? error.name : "unknown");
    const failed = NextResponse.json({ success: false, error: "Could not fully sign out." }, { status: 500 });
    clearSessionCookies(failed);
    return failed;
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  clearSessionCookies(response);
  return response;
}
