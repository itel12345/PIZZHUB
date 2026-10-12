// src/app/api/favorites/route.ts
//
// The signed-in user's favorites as a whole: list them, add one.
// Removing one is DELETE in [pizzaId]/route.ts, and the guest-to-account
// hand-off at login is merge/route.ts — neither belongs in this file.
// Every response is the full favorites list as pizza-id strings, the
// shape FavoritesContext keeps in state.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addFavorite, getFavoritePizzaIds } from "@/lib/favorites";

const addFavoriteSchema = z.object({
  pizzaId: z.coerce.number().int().positive(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    const body = await request.json().catch(() => null);
    const result = addFavoriteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // A deleted pizza would fail the Favorite foreign key and surface as
    // a 500; answer 404 instead.
    const pizza = await prisma.pizza.findUnique({
      where: { id: result.data.pizzaId },
      select: { id: true },
    });
    if (!pizza) {
      return NextResponse.json({ error: "Pizza not found." }, { status: 404 });
    }

    await addFavorite(userId, result.data.pizzaId);
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