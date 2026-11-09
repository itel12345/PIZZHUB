// src/proxy.ts  (Next.js 16 name for what used to be middleware.ts)
//
// Two jobs, both cheap and both deliberately NOT the real authorization:
//
//  1. CSRF: every state-changing /api request must come from this site's
//     own origin (lib/origin.ts). Exempt: the Paystack webhook, which has
//     no cookies and authenticates itself by HMAC signature.
//  2. Admin routes: bounce requests that carry no session cookie at all,
//     before they reach a page or handler. This only checks the cookie is
//     PRESENT. Proving it is a live session for a current admin needs the
//     database, which happens in requireAdmin() (every /api/admin route)
//     and the admin layout. Never treat this file as the only gate.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/authConstants";
import { checkRequestOrigin, allowedOriginsFromEnv } from "@/lib/origin";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const result = checkRequestOrigin({
      method: request.method,
      pathname,
      origin: request.headers.get("origin"),
      secFetchSite: request.headers.get("sec-fetch-site"),
      host: request.headers.get("host"),
      forwardedHost: request.headers.get("x-forwarded-host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
      allowedOrigins: allowedOriginsFromEnv(),
    });
    if (!result.ok) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const isAdminArea =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin");

  if (isAdminArea && !request.cookies.get(SESSION_COOKIE)?.value) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const signInUrl = new URL("/", request.url);
    signInUrl.searchParams.set("admin_auth_required", "1");
    // Preserve where the admin was headed so login can send them back.
    signInUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
