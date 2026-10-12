// src/app/api/admin/uploads/sign/route.ts
//
// The client calls this before uploading, gets back a short-lived
// signature, then uploads the actual file straight to Cloudinary. This
// route never sees or touches the image bytes — only admins can ever
// get a valid signature (requireAdmin), so only admins can ever
// successfully upload into our Cloudinary account, even though the
// upload itself doesn't go through our infrastructure.

import { NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth";
import { createSignedUpload } from "@/lib/cloudinary";

export async function POST() {
  try {
    await requireAdmin();

    const signed = createSignedUpload();

    return NextResponse.json(signed, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Couldn't start the upload. Try again." },
      { status: 500 }
    );
  }
}
