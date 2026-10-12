// src/app/api/admin/settings/route.ts
//
// GET + PATCH in one file, same convention as
// admin/products/[id]/route.ts (PATCH + DELETE together). Both methods
// operate on the exact same singleton resource, so one file mirrors
// the resource, not an arbitrary method-per-file split.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth";
import { siteSettingsUpdateSchema } from "@/lib/validation/adminSettings";
import { getSiteSettings, updateSiteSettings, InvalidSettingsError } from "@/lib/settings";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getSiteSettings();
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const result = siteSettingsUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const settings = await updateSiteSettings(result.data);
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    if (error instanceof InvalidSettingsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}