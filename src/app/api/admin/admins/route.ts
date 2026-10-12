// src/app/api/admin/admins/route.ts
//
// GET (list), POST (promote), DELETE (demote) in one file — same
// resource, same convention as admin/products/[id]/route.ts having
// PATCH+DELETE together. The safeguards against self-lockout and
// removing the last admin live in lib/admin-account.ts, not here —
// this route's only job is auth, shape validation, and mapping
// business errors to clean HTTP responses.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth";
import { promoteAdminSchema, demoteAdminSchema } from "@/lib/validation/adminSettings";
import {
  listAdmins,
  promoteUserToAdmin,
  demoteAdmin,
  UserNotFoundError,
  AlreadyAdminError,
  LastAdminError,
  NotAnAdminError,
  OwnerProtectedError,
} from "@/lib/admin-account";

export async function GET() {
  try {
    await requireAdmin();
    const admins = await listAdmins();
    return NextResponse.json({ admins }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const result = promoteAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please enter a valid email.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const admin = await promoteUserToAdmin(result.data.email);
    return NextResponse.json({ admin }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    if (error instanceof UserNotFoundError || error instanceof AlreadyAdminError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const body = await request.json();
    const result = demoteAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "A user id is required." }, { status: 400 });
    }

    await demoteAdmin(session.userId, result.data.userId);
    return NextResponse.json(
      { success: true, wasSelf: result.data.userId === session.userId },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    if (
      error instanceof LastAdminError ||
      error instanceof NotAnAdminError ||
      error instanceof UserNotFoundError ||
      error instanceof OwnerProtectedError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}