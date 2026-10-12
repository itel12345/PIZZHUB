// src/app/api/account/preferences/route.ts
//
// Marketing preferences (Profile → Settings → Marketing). Same
// requireUser gate as every other customer route — userId comes
// exclusively from the verified session, never from the request body.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { marketingPreferencesSchema } from "@/lib/validation/account";
import { getMarketingPreferences, updateMarketingPreferences } from "@/lib/account";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);
    const preferences = await getMarketingPreferences(userId);
    return NextResponse.json({ preferences }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    const body = await request.json();
    const result = marketingPreferencesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const preferences = await updateMarketingPreferences(userId, result.data);
    return NextResponse.json({ preferences }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
