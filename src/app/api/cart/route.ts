// src/app/api/cart/route.ts
//
// The signed-in user's cart as a whole: read it, add a pizza to it,
// empty it. Single-line operations live in items/[id]/route.ts and the
// guest-to-account hand-off at login lives in merge/route.ts — this file
// must not contain either of those handlers, since each URL's handlers
// have different request shapes.
//
// Every response is a CartSummaryDTO built server-side from the stored
// cart, so the client always reconciles with authoritative prices rather
// than whatever it had cached.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addItemToCart, clearCart, getCartSummary } from "@/lib/cart";
import { addCartItemSchema } from "@/lib/validation/cart";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    // A malformed body is the caller's mistake (400), not a server fault.
    const body = await request.json().catch(() => null);
    const result = addCartItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request.", fieldErrors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { pizzaId, quantity } = result.data;

    // Same rule mergeGuestCart applies: a pizza an admin has since
    // deleted must not reach the foreign key and surface as a 500.
    const pizza = await prisma.pizza.findUnique({
      where: { id: pizzaId },
      select: { id: true },
    });
    if (!pizza) {
      return NextResponse.json({ error: "Pizza not found." }, { status: 404 });
    }

    const summary = await addItemToCart(userId, pizzaId, quantity);
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);
    await clearCart(userId);
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