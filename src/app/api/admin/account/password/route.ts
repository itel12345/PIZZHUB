// src/app/api/admin/account/password/route.ts
//
// Deliberately only ever acts on the CALLER's own account — userId
// comes from the verified session (requireAdmin), never from the
// request body. There is no version of this endpoint that takes a
// target userId; changing someone else's password isn't a feature
// this app has, on purpose.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation/adminSettings";
import { changeAdminPassword, InvalidCurrentPasswordError } from "@/lib/admin-account";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await changeAdminPassword(
      session.userId,
      result.data.currentPassword,
      result.data.newPassword
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    if (error instanceof InvalidCurrentPasswordError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}