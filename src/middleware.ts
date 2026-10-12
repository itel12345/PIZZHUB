// src/middleware.ts
//
// First line of defense for everything under /admin and /api/admin:
// runs before any page or route handler, so an unauthenticated request
// never even reaches prisma. The API routes ALSO call requireAdmin()
// themselves (src/lib/auth.ts) — that's not redundant, it's
// defense-in-depth: middleware can be misconfigured or skipped for a
// given path in the future, but a route handler that checks for itself
// is safe regardless of what middleware does.

import { NextResponse, type NextRequest } from "next/server";
import { verifyEdgeJwt } from "@/lib/edgeJwt";
// Imported from authConstants, NOT lib/auth: lib/auth imports Prisma,
// which can't be bundled for the Edge runtime this file runs on.
import { ADMIN_SESSION_COOKIE } from "@/lib/authConstants";

export async function middleware(request: NextRequest) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // Fail closed: if the secret isn't configured, nobody gets in,
    // rather than nobody getting checked.
    return denyAccess(request);
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifyEdgeJwt(token, secret);
  const isAdmin =
    payload !== null &&
    (payload as { role?: string }).role === "ADMIN";

  if (isAdmin) {
    return NextResponse.next();
  }

  return denyAccess(request);
}

function denyAccess(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const signInUrl = new URL("/", request.url);
  signInUrl.searchParams.set("admin_auth_required", "1");
  // Preserve exactly where the admin was trying to go (path + any of
  // its own query string) so a successful login can send them straight
  // back instead of dropping them on the homepage.
  signInUrl.searchParams.set("redirect", pathname + search);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
