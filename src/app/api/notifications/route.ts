// src/app/api/notifications/route.ts
//
// Collection-level notification actions for the signed-in user: a page
// of them, mark every one read, delete every one. Acting on a single
// notification is PATCH/DELETE in [id]/route.ts. Every function called
// here is scoped to userId from the verified session, so none of these
// can touch another user's notifications.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import {
  listNotificationsForUser,
  markAllNotificationsAsRead,
  clearAllNotificationsForUser,
} from "@/lib/notifications";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    // Out-of-range or non-numeric values fall back to defaults instead of
    // erroring, same convention as the admin list routes.
    const searchParams = request.nextUrl.searchParams;

    const rawPage = Number(searchParams.get("page"));
    const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10_000) : 1;

    const rawPageSize = Number(searchParams.get("pageSize"));
    const pageSize =
      Number.isInteger(rawPageSize) && rawPageSize > 0
        ? Math.min(rawPageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const result = await listNotificationsForUser({ userId, page, pageSize });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// "Mark all as read" — takes no body; it always means the caller's own.
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);
    await markAllNotificationsAsRead(userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// "Clear all" — takes no body; it always means the caller's own.
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);
    await clearAllNotificationsForUser(userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}