// src/app/api/favorites/merge/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { mergeGuestFavorites } from "@/lib/favorites";

const mergeSchema = z.object({
  pizzaIds: z.array(z.coerce.number().int().positive()).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    const body = await request.json();
    const result = mergeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const favorites = await mergeGuestFavorites(userId, result.data.pizzaIds);
    return NextResponse.json({ favorites }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}