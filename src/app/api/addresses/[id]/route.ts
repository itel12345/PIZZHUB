// src/app/api/addresses/[id]/route.ts
//
// "Set as default" is not a separate endpoint — it's a PATCH with
// { isDefault: true }, same as any other field update. lib/addresses.ts
// handles unsetting any previous default inside a transaction; this
// route's only job is auth, shape validation, and mapping
// AddressNotFoundError to a 404.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { addressUpdateSchema } from "@/lib/validation/address";
import { updateAddressForUser, deleteAddressForUser, AddressNotFoundError } from "@/lib/addresses";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await requireUser(request);
    const { id } = await params;

    const body = await request.json();
    const result = addressUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const address = await updateAddressForUser(userId, id, result.data);
    return NextResponse.json({ address }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (error instanceof AddressNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await requireUser(request);
    const { id } = await params;

    await deleteAddressForUser(userId, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (error instanceof AddressNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}