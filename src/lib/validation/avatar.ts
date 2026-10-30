// src/lib/validation/avatar.ts
//
// Profile-picture rules shared by the browser (fast feedback before
// anything is uploaded) and the server (the only check that is actually
// enforced). Deliberately NOT marked server-only and imports nothing
// server-side, so one set of constants defines "what is an acceptable
// avatar" for both ends and they cannot drift apart.
//
// Two different size limits exist on purpose:
//   AVATAR_MAX_SELECT_BYTES  what a person may PICK. Phone photos are
//                            routinely 5-10 MB, so the browser accepts
//                            those and shrinks them itself.
//   AVATAR_MAX_BYTES         what the SERVER will accept. The browser
//                            sends a ~512px re-encode (typically well
//                            under 300 KB), so this is generous for
//                            legitimate use and keeps the request far
//                            below serverless body-size ceilings (see
//                            lib/cloudinary.ts for why that matters).
//
// SVG is excluded deliberately: it can carry script, and these files
// are served back from a public bucket.

export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AvatarMimeType = (typeof AVATAR_ALLOWED_TYPES)[number];

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MAX_SELECT_BYTES = 10 * 1024 * 1024;
export const AVATAR_OUTPUT_SIZE = 512;

export const AVATAR_EXTENSIONS: Record<AvatarMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAvatarMimeType(value: string): value is AvatarMimeType {
  return (AVATAR_ALLOWED_TYPES as readonly string[]).includes(value);
}

/**
 * First-pass check on a file the person just picked. Returns a message
 * for the UI, or null when the file is acceptable. `type` is the
 * browser-reported MIME type, which is only a hint — the server never
 * trusts it and sniffs the actual bytes instead.
 */
export function validateAvatarSelection(file: { type: string; size: number }): string | null {
  if (!isAvatarMimeType(file.type)) {
    return "Please choose a JPEG, PNG, or WebP image.";
  }
  if (file.size <= 0) {
    return "That file is empty.";
  }
  if (file.size > AVATAR_MAX_SELECT_BYTES) {
    return "That image is too large. Please choose one under 10 MB.";
  }
  return null;
}

/**
 * The centered square region to crop from a width x height image, and
 * the edge length to draw it at (never upscaled past the source).
 * Pure so it can be tested without a browser.
 */
export function computeSquareCrop(
  width: number,
  height: number,
  maxOutput: number = AVATAR_OUTPUT_SIZE
): { sx: number; sy: number; side: number; output: number } {
  const side = Math.min(width, height);
  return {
    sx: Math.floor((width - side) / 2),
    sy: Math.floor((height - side) / 2),
    side,
    output: Math.max(1, Math.min(maxOutput, side)),
  };
}
