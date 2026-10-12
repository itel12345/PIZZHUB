// src/app/api/orders/[id]/route.ts
//
// Powers the Order Success page's real data — no more assuming the
// most recent order in localStorage is "the" order, no more trusting
// a redirect query param as proof of anything. Ownership-checked same
// as Cart items: an order id alone is never sufficient.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { findOwnedOrder } from "@/lib/orders";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser(request);
    const { id } = await params;

    const order = await findOwnedOrder(userId, id);
    if (!order) {
      // Same response whether the id doesn't exist or belongs to
      // someone else — that distinction is exactly what shouldn't be
      // observable to the caller.
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}