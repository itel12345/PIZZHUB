// src/app/api/account/password/route.ts
//
// Deliberately only ever acts on the CALLER's own account — userId
// comes from requireUser's verified session, never from the request
// body. Same shape as /api/admin/account/password, but gated by
// requireUser (Bearer token) instead of requireAdmin (cookie): the
// two are separate auth mechanisms for separate audiences (see
// lib/auth.ts), and this route never imports anything from
// lib/admin-account.ts — authorization here comes from calling
// requireUser, not from which "changePassword"-shaped function
// happens to get called.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { changeUserPasswordSchema } from "@/lib/validation/account";
import { changeUserPassword, InvalidCurrentPasswordError } from "@/lib/account";

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    const body = await request.json();
    const result = changeUserPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Returns a freshly signed token carrying the new authVersion —
    // see the comment on changeUserPassword itself for why this has
    // to happen and can't be avoided: bumping authVersion invalidates
    // EVERY session including the one making this exact request, so
    // the caller must receive a replacement to keep working. The
    // client is responsible for immediately storing it in place of
    // the old one (see AuthContext.refreshToken).
    const { token } = await changeUserPassword(userId, result.data);

    return NextResponse.json({ success: true, token }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (error instanceof InvalidCurrentPasswordError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
