// GET /api/auth/me — who does the server think I am right now?
//
// AuthContext calls this on load to confirm the cached profile in
// localStorage still matches a live server-side session (it may have
// been revoked, expired, or belong to a deleted account).

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/authConstants";
import { validateSessionToken } from "@/lib/session";
import { isTrustedAvatarUrl } from "@/lib/avatar-url";

export async function GET(request: NextRequest) {
  try {
    const session = await validateSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const { user } = session;
    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: isTrustedAvatarUrl(user.image) ? user.image : undefined,
          emailVerified: user.emailVerifiedAt !== null,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("me failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
