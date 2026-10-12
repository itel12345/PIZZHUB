// src/app/api/cart/items/[id]/route.ts
//
// [id] is CartItem.id (a cuid) — not the pizza id. Every mutation here
// verifies ownership via findOwnedCartItem before touching anything:
// this is the IDOR check the whole Cart module hinges on. A user
// guessing/incrementing another cart item's id must get exactly the
// same 404 as a nonexistent id — never a 403 that confirms "this id is
// real, just not yours."

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOwnedCartItem, getCartSummary } from "@/lib/cart";
import { updateCartItemQuantitySchema } from "@/lib/validation/cart";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser(request);
    const { id } = await params;

    const body = await request.json();
    const result = updateCartItemQuantitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request.", fieldErrors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const owned = await findOwnedCartItem(userId, id);
    if (!owned) {
      // Same response whether the id doesn't exist at all or exists
      // but belongs to someone else — the distinction itself is
      // information an attacker shouldn't get.
      return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
    }

    await prisma.cartItem.update({
      where: { id },
      data: { quantity: result.data.quantity },
    });

    const summary = await getCartSummary(userId);
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser(request);
    const { id } = await params;

    const owned = await findOwnedCartItem(userId, id);
    if (!owned) {
      return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id } });

    const summary = await getCartSummary(userId);
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}