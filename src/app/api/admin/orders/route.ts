// src/app/api/admin/orders/route.ts
//
// GET only — this route exists for completeness/API consistency with
// the rest of the admin surface (Products has the equivalent), but the
// admin orders LIST PAGE itself queries getOrdersForAdmin directly as
// a server component, same reasoning admin/products/page.tsx already
// uses: avoids a redundant client-side round trip for the initial
// page load. This route is for any future client-side re-fetch needs
// (e.g. a "refresh" button) that don't warrant a full page reload.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth";
import { getOrdersForAdmin, type AdminOrderStatusFilter } from "@/lib/orders";

const STATUS_VALUES: AdminOrderStatusFilter[] = ["all", "pending", "confirmed", "cancelled"];
const MAX_PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;

    const rawPage = Number(searchParams.get("page"));
    const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10_000) : 1;

    const rawPageSize = Number(searchParams.get("pageSize"));
    const pageSize =
      Number.isInteger(rawPageSize) && rawPageSize > 0
        ? Math.min(rawPageSize, MAX_PAGE_SIZE)
        : 10;

    const rawStatus = searchParams.get("status") ?? "all";
    const status: AdminOrderStatusFilter = STATUS_VALUES.includes(
      rawStatus as AdminOrderStatusFilter
    )
      ? (rawStatus as AdminOrderStatusFilter)
      : "all";

    const query = (searchParams.get("q") ?? "").trim().slice(0, 100);

    const result = await getOrdersForAdmin({ page, pageSize, status, query });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
