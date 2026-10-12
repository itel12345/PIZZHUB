// src/app/api/account/route.ts
//
// DELETE = Profile → Settings → Danger Zone → Delete account. Requires
// re-proving the current password in the request body — a valid
// Bearer token alone (which could be a left-open session on a shared
// device) is not sufficient to trigger something this destructive.
// See lib/account.ts's deleteUserAccount for what "delete" actually
// does to the data (anonymize + selectively hard-delete, not a raw
// User row delete).

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError, ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { deleteAccountSchema } from "@/lib/validation/account";
import {
  deleteUserAccount,
  InvalidCurrentPasswordError,
  AdminAccountProtectedError,
} from "@/lib/account";

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    const body = await request.json();
    const result = deleteAccountSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await deleteUserAccount(userId, result.data.currentPassword);

    const response = NextResponse.json({ success: true }, { status: 200 });

    // Defense-in-depth: this endpoint already refuses to delete an
    // ADMIN-role account (see AdminAccountProtectedError below), so
    // this cookie shouldn't ordinarily be set for whoever just
    // deleted their account — clearing it anyway costs nothing and
    // matches /api/auth/logout's own behavior.
    response.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (error instanceof InvalidCurrentPasswordError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof AdminAccountProtectedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
