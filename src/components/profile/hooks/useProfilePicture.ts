"use client";

// src/components/profile/hooks/useProfilePicture.ts
//
// Client-side half of profile pictures. Three steps, deliberately split
// so the UI can show a PREVIEW between choosing a file and saving it:
//
//   prepareAvatar  validate the pick, then crop to a centered square and
//                  shrink to ~512px in the browser. Phone photos are
//                  5-10 MB; this turns them into a few hundred KB so
//                  they fit under serverless body limits (see
//                  lib/cloudinary.ts for why that matters) and load
//                  fast everywhere the avatar appears.
//   uploadAvatar   POST the prepared image as multipart/form-data.
//   removeAvatar   DELETE the current picture.
//
// Everything here is convenience and fast feedback only. The server
// (lib/avatar.ts) re-validates size and sniffs the real file type, and
// never trusts anything this file did.

import { useCallback } from "react";
import { getStoredAuthToken } from "@/components/auth";
import {
  AVATAR_EXTENSIONS,
  AVATAR_MAX_BYTES,
  AVATAR_OUTPUT_SIZE,
  computeSquareCrop,
  isAvatarMimeType,
  validateAvatarSelection,
} from "@/lib/validation/avatar";

// Not useAccountSettings's authHeaders(): that one sets
// "Content-Type: application/json", which would corrupt a multipart
// body. For FormData the browser must set Content-Type itself (it adds
// the multipart boundary), so only Authorization is sent here.
function bearerHeader(): HeadersInit {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface PreparedAvatar {
  blob: Blob;
  /** An object URL for <img>; the caller must revoke it when done. */
  previewUrl: string;
}

export type PrepareResult = { error: string } | { prepared: PreparedAvatar };

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function cropAndShrink(file: File): Promise<Blob | null> {
  // Applies the photo's EXIF rotation, so portrait phone shots aren't sideways.
  const bitmap = await createImageBitmap(file);

  try {
    const { sx, sy, side, output } = computeSquareCrop(
      bitmap.width,
      bitmap.height,
      AVATAR_OUTPUT_SIZE
    );

    const canvas = document.createElement("canvas");
    canvas.width = output;
    canvas.height = output;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, sx, sy, side, side, 0, 0, output, output);

    // WebP is smallest and keeps transparency. A browser that can't
    // encode it hands back PNG instead, which is also accepted.
    const preferred = await encode(canvas, "image/webp", 0.85);
    if (preferred && isAvatarMimeType(preferred.type) && preferred.size <= AVATAR_MAX_BYTES) {
      return preferred;
    }

    // Last resort for an unusually large result: JPEG on white (JPEG has
    // no transparency, so unfilled pixels would otherwise turn black).
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, output, output);
    return await encode(canvas, "image/jpeg", 0.85);
  } finally {
    bitmap.close();
  }
}

export function useProfilePicture() {
  const prepareAvatar = useCallback(async (file: File): Promise<PrepareResult> => {
    const problem = validateAvatarSelection(file);
    if (problem) return { error: problem };

    let blob: Blob | null;
    try {
      blob = await cropAndShrink(file);
    } catch {
      return { error: "We couldn't read that image. Try a different photo." };
    }

    if (!blob || !isAvatarMimeType(blob.type)) {
      return { error: "We couldn't process that image. Try a different photo." };
    }
    if (blob.size > AVATAR_MAX_BYTES) {
      return { error: "That image is still too large after resizing. Try a different photo." };
    }

    return { prepared: { blob, previewUrl: URL.createObjectURL(blob) } };
  }, []);

  const uploadAvatar = useCallback(
    async (blob: Blob): Promise<{ error?: string; avatarUrl?: string }> => {
      try {
        const body = new FormData();
        const extension = isAvatarMimeType(blob.type) ? AVATAR_EXTENSIONS[blob.type] : "webp";
        body.append("file", blob, `avatar.${extension}`);

        const response = await fetch("/api/account/avatar", {
          method: "POST",
          headers: bearerHeader(),
          body,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { error: data.error ?? "Something went wrong." };
        }

        return { avatarUrl: data.avatarUrl as string };
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    },
    []
  );

  const removeAvatar = useCallback(async (): Promise<{ error?: string }> => {
    try {
      const response = await fetch("/api/account/avatar", {
        method: "DELETE",
        headers: bearerHeader(),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { error: data.error ?? "Something went wrong." };
      }

      return {};
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  }, []);

  return { prepareAvatar, uploadAvatar, removeAvatar };
}
