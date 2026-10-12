// src/app/api/favorites/[pizzaId]/route.ts
//
// No separate ownership lookup step needed here, unlike Cart's
// findOwnedCartItem — removeFavorite's query is already scoped to
// { userId, pizzaId } directly (see lib/favorites.ts), so there's no
// intermediate "fetch it, check who owns it, then act" sequence for an
// id-guessing attack to exploit in the first place: a userId that
// doesn't own that favorite simply matches zero rows.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { removeFavorite, getFavoritePizzaIds } from "@/lib/favorites";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pizzaId: string }> }
) {
  try {
    const { userId } = await requireUser(request);
    const { pizzaId } = await params;

    const parsed = Number(pizzaId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return NextResponse.json({ error: "Invalid pizza id." }, { status: 400 });
    }

    await removeFavorite(userId, parsed);
    const favorites = await getFavoritePizzaIds(userId);
    return NextResponse.json({ favorites }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}