// src/app/api/admin/customers/route.ts
//
// GET only, same reasoning as admin/orders/route.ts: the admin
// Customers LIST PAGE queries getCustomersForAdmin directly as a
// server component for the initial page load (see
// admin/customers/page.tsx) to avoid a redundant client-side round
// trip. This route exists for API consistency with the rest of the
// admin surface, and for any future client-side re-fetch (e.g. a
// "refresh" button) that doesn't warrant a full page reload.
//
// requireAdmin() here is defense-in-depth on top of middleware.ts,
// which already blocks unauthenticated requests to /api/admin/* before
// they reach this handler — same pattern as every other /api/admin/*
// route in this app.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth";
import { getCustomersForAdmin, type AdminCustomerRoleFilter } from "@/lib/customers";

const ROLE_VALUES: AdminCustomerRoleFilter[] = ["all", "user", "admin"];
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

    const rawRole = searchParams.get("role") ?? "all";
    const role: AdminCustomerRoleFilter = ROLE_VALUES.includes(
      rawRole as AdminCustomerRoleFilter
    )
      ? (rawRole as AdminCustomerRoleFilter)
      : "all";

    const query = (searchParams.get("q") ?? "").trim().slice(0, 100);

    const result = await getCustomersForAdmin({ page, pageSize, role, query });
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