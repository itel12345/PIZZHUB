// src/app/api/auth/logout/route.ts
//
// Customer logout has always been "clear localStorage" (client-only,
// fine for that token — it's not tied to any server-side session).
// The admin cookie is different: it's HttpOnly, so client JS can't
// clear it, and "log out" must actually destroy it server-side or the
// cookie keeps working until it expires (constitution: "logout must
// completely destroy the session server-side and purge all client
// cookies"). AuthContext.logout() calls this endpoint; it's a no-op
// for accounts that never had the cookie in the first place.

import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
