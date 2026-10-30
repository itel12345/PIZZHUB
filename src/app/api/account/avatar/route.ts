// src/app/api/account/avatar/route.ts
//
// Set or remove the signed-in user's profile picture. The target user
// is always the one requireUser() verified from the token — the request
// carries only the image, never a user id or a storage path, so there
// is nothing in the request a caller could change to touch someone
// else's picture. All real validation happens in lib/avatar.ts; the
// checks here exist to refuse an oversized body BEFORE it is read into
// memory.

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import {
  setUserAvatar,
  removeUserAvatar,
  InvalidAvatarError,
  AvatarTooLargeError,
} from "@/lib/avatar";
import { AVATAR_MAX_BYTES } from "@/lib/validation/avatar";

// Multipart framing (boundary lines, field headers) adds a little on
// top of the file itself.
const MULTIPART_OVERHEAD_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);

    // formData() buffers the entire body. Without a length gate, an
    // authenticated caller could stream gigabytes at it. A declared
    // length is required so the limit can be enforced up front.
    const contentLength = Number(request.headers.get("content-length"));
    if (!Number.isFinite(contentLength) || contentLength <= 0) {
      return NextResponse.json({ error: "Invalid request." }, { status: 411 });
    }
    if (contentLength > AVATAR_MAX_BYTES + MULTIPART_OVERHEAD_BYTES) {
      return NextResponse.json({ error: "That image is too large." }, { status: 413 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image was provided." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { avatarUrl } = await setUserAvatar(userId, bytes);

    return NextResponse.json({ avatarUrl }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (error instanceof AvatarTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }

    if (error instanceof InvalidAvatarError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireUser(request);
    await removeUserAvatar(userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
