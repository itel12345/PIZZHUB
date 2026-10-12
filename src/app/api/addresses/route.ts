// src/app/api/addresses/route.ts
//
// List and create the signed-in user's saved addresses. Update, delete
// and "set as default" are in [id]/route.ts and must not be duplicated
// here. userId comes only from the verified session; createAddressForUser
// and listAddressesForUser both scope every query to it, so one user can
// never read or write another's addresses through this route.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { addressInputSchema } from "@/lib/validation/address";
import { listAddressesForUser, createAddressForUser } from "@/lib/addresses";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);
    const addresses = await listAddressesForUser(userId);
    return NextResponse.json({ addresses }, { status: 200 });
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
    const result = addressInputSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const address = await createAddressForUser(userId, result.data);
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}