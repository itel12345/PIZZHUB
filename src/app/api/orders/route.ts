// src/app/api/orders/route.ts
//
// A page of the signed-in user's own order history. A single order is
// GET in [id]/route.ts. getOrdersForUser always filters by userId (it is
// not an optional parameter), so this route cannot return anyone else's
// orders. Full OrderDTOs come back in the list, so the UI needs no
// per-order follow-up request.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";

const DEFAULT_PAGE_SIZE = 10;
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

    const result = await getOrdersForUser({ userId, page, pageSize });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}