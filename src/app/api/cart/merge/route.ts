// src/app/api/cart/merge/route.ts
//
// Called exactly once, right after login, with whatever was sitting in
// localStorage's guest cart. See mergeGuestCart's docblock in
// src/lib/cart.ts for the idempotency caveat — the short version is
// CartContext must clear localStorage immediately on a successful
// response here, not "eventually" or "on next render."

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { mergeCartSchema } from "@/lib/validation/cart";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    const body = await request.json();
    const result = mergeCartSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request.", fieldErrors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const summary = await mergeGuestCart(userId, result.data.items);
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}