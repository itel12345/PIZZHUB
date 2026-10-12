// src/lib/cloudinary.ts
//
// Server-only. Cloudinary's "signed upload" flow: we sign a small set
// of params here (folder, timestamp, and anything else we want to
// pin), hand the signature to the client, and the client uploads the
// FILE ITSELF directly to Cloudinary — never through our own server.
//
// Why direct-to-cloud instead of proxying through an API route: Netlify
// Functions have a request body size ceiling well under what a phone
// photo can produce. Routing the binary through our own serverless
// function would silently fail on realistic uploads. Signing keeps us
// in control of *what* gets uploaded (folder, size/type constraints
// via the upload preset, who's allowed to ask for a signature at all —
// requireAdmin() gates the sign endpoint) without our server ever
// having to hold the bytes.

import "server-only";
import crypto from "crypto";
import { getCloudinaryConfig } from "./env";

export const UPLOAD_FOLDER = "pizzhub/products";

interface SignedUploadParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export function createSignedUpload(): SignedUploadParams {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary's signing rule: alphabetically sort every param that
  // will be sent (except file/api_key/signature/resource_type), join
  // as key=value pairs with '&', append the api secret, SHA-1 it.
  const paramsToSign = { folder: UPLOAD_FOLDER, timestamp };
  const toSign = Object.entries(paramsToSign)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");

  return { timestamp, signature, apiKey, cloudName, folder: UPLOAD_FOLDER };
}

/**
 * Cloudinary secure URLs look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/v169.../folder/name.jpg
 * The public_id (needed to delete the asset later) is everything after
 * the version segment, minus the file extension. Returns null if the
 * URL isn't a Cloudinary URL we recognize — callers should treat that
 * as "nothing to delete" rather than an error.
 */
/** True only for URLs actually hosted on our Cloudinary account. */
export function isOwnCloudinaryUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return false;
    const { cloudName } = getCloudinaryConfig();
    // res.cloudinary.com/<cloud_name>/image/upload/...
    return parsed.pathname.split("/")[1] === cloudName;
  } catch {
    return false;
  }
}

export function extractPublicId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return null;

    const uploadMarker = "/upload/";
    const idx = parsed.pathname.indexOf(uploadMarker);
    if (idx === -1) return null;

    let rest = parsed.pathname.slice(idx + uploadMarker.length);
    // Strip a leading version segment like "v1712345678/"
    rest = rest.replace(/^v\d+\//, "");
    // Strip the file extension
    rest = rest.replace(/\.[a-zA-Z0-9]+$/, "");

    return rest || null;
  } catch {
    return null;
  }
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);

  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body }
  );

  if (!response.ok) {
    // Non-fatal by design: a failed cleanup of an orphaned asset
    // shouldn't block the admin's actual request (saving/deleting a
    // product). Log it so it's visible, don't throw.
    console.error(
      `Failed to delete Cloudinary asset ${publicId}: ${response.status}`
    );
  }
}
