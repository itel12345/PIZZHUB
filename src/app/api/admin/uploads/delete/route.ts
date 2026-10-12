// src/app/api/admin/uploads/delete/route.ts
//
// Called when an admin replaces or removes a product image, so the old
// asset doesn't sit in Cloudinary forever accumulating storage cost.
// Takes the OLD image URL (not a public_id) because that's all the
// Pizza table stores today — see extractPublicId() in
// src/lib/cloudinary.ts for how the public_id gets derived from it.
//
// Deliberately tolerant: deleting a stray/foreign/already-gone asset
// is not something the admin should ever see as an error — the thing
// they care about (their product's image) is already handled by the
// product save itself.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth";
import { extractPublicId, deleteCloudinaryAsset } from "@/lib/cloudinary";

const bodySchema = z.object({
  url: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const result = bodySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: true }); // nothing sensible to delete
    }

    const publicId = extractPublicId(result.data.url);
    if (publicId) {
      await deleteCloudinaryAsset(publicId);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    console.error(error);
    // Still 200: cleanup failures shouldn't surface as user-facing errors.
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
