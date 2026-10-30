// src/lib/avatar.ts
//
// Server-only. Profile pictures: validates the bytes, stores them in a
// Supabase Storage bucket, and keeps User.image pointing at the current
// one. Routes call these functions with the userId that requireUser()
// verified — nothing here ever takes a userId, a path, or a URL from a
// request, which is what makes "you can only change your own picture"
// structural rather than a check someone could forget:
//
//   * Object paths are built here as `<userId>/<random>.<ext>`, so a
//     caller can only ever write inside their own folder.
//   * Deleting only ever touches an object whose URL is inside that
//     same folder of OUR bucket (ownedObjectPath), so a tampered or
//     legacy User.image value can't be turned into "delete somebody
//     else's file" or "delete an arbitrary object".
//
// Why the service-role key: the bucket is public-READ (anyone with the
// URL can view an avatar, which is how <img> works) but has no
// client-side write policy at all. Every write goes through this file
// using the service key, so Supabase RLS never needs to know who users
// are — our own auth is the gate. The key is read in one place
// (getSupabaseStorageConfig) and never reaches the browser.
//
// Every upload gets a NEW unique filename instead of overwriting one
// per user. That makes each URL immutable, so it can be cached
// forever, and "replace" never shows a stale cached picture — the URL
// itself changes, and the old object is cleaned up afterwards.

import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "./prisma";
import { AuthError } from "./auth";
import { getSupabaseStorageConfig } from "./env";
import {
  AVATAR_EXTENSIONS,
  AVATAR_MAX_BYTES,
  type AvatarMimeType,
} from "./validation/avatar";

export class InvalidAvatarError extends Error {}
export class AvatarTooLargeError extends Error {}

const STORAGE_TIMEOUT_MS = 15_000;

// Without this, a hung Supabase connection would hold the serverless
// function open until the platform kills it.
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeout = AbortSignal.timeout(STORAGE_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
}

let cached: { fingerprint: string; client: ReturnType<typeof createClient> } | null = null;

function getStorage() {
  const config = getSupabaseStorageConfig();
  const fingerprint = `${config.url}|${config.serviceRoleKey}`;

  if (!cached || cached.fingerprint !== fingerprint) {
    cached = {
      fingerprint,
      client: createClient(config.url, config.serviceRoleKey, {
        // Server-side service client: no user sessions to store or refresh.
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: fetchWithTimeout },
      }),
    };
  }

  return {
    storage: cached.client.storage.from(config.bucket),
    publicBase: `${config.url}/storage/v1/object/public/${config.bucket}/`,
  };
}

/**
 * Decides the real type from the file's leading bytes. The browser's
 * claimed MIME type and the filename are attacker-controlled; the
 * bytes are what an image decoder will actually be handed.
 */
export function sniffAvatarType(bytes: Uint8Array): AvatarMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && pngSignature.every((byte, index) => bytes[index] === byte)) {
    return "image/png";
  }

  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return "image/webp";
  }

  return null;
}

/**
 * The object path for `url` — but only if it is a file this module
 * could have created for THIS user: inside our bucket, directly in
 * `<userId>/`, with a name and extension we generate. Anything else
 * (an old external image URL, another user's file, a path with extra
 * segments) returns null and is never deleted.
 */
export function ownedObjectPath(
  userId: string,
  url: string | null | undefined,
  publicBase: string
): string | null {
  if (!url || !url.startsWith(publicBase)) return null;

  const path = url.slice(publicBase.length);
  const [folder, file, ...rest] = path.split("/");

  if (rest.length > 0 || folder !== userId) return null;
  if (!file || !/^[A-Za-z0-9-]+\.(jpg|png|webp)$/.test(file)) return null;

  return path;
}

/**
 * Best-effort removal of the stored object behind a User.image URL.
 * NEVER throws: by the time this runs the database already points
 * somewhere else, and failing the request because cleanup hiccuped
 * would leave the person looking at an error for a change that
 * actually succeeded. Worst case is an orphaned file, which is logged.
 */
export async function deleteStoredAvatar(
  userId: string,
  imageUrl: string | null | undefined
): Promise<void> {
  try {
    const { storage, publicBase } = getStorage();
    const path = ownedObjectPath(userId, imageUrl, publicBase);
    if (!path) return;

    const { error } = await storage.remove([path]);
    if (error) console.error("Avatar cleanup failed:", path, error.message);
  } catch (error) {
    console.error("Avatar cleanup failed:", error);
  }
}

/**
 * Validates and stores a new picture, points User.image at it, and
 * deletes the previous one. Order matters: the new object is uploaded
 * first and the old one removed last, so a failure at any step never
 * leaves the user with no picture or a URL pointing at nothing.
 */
export async function setUserAvatar(
  userId: string,
  bytes: Uint8Array
): Promise<{ avatarUrl: string }> {
  if (bytes.byteLength === 0) {
    throw new InvalidAvatarError("That file is empty.");
  }
  if (bytes.byteLength > AVATAR_MAX_BYTES) {
    throw new AvatarTooLargeError("That image is too large.");
  }

  const type = sniffAvatarType(bytes);
  if (!type) {
    throw new InvalidAvatarError("Please upload a JPEG, PNG, or WebP image.");
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  if (!current) {
    throw new AuthError(401, "Not authenticated.");
  }

  const { storage, publicBase } = getStorage();
  const path = `${userId}/${randomUUID()}.${AVATAR_EXTENSIONS[type]}`;

  const { error } = await storage.upload(path, bytes, {
    // The sniffed type, never the client-declared one.
    contentType: type,
    // Safe because the filename is unique per upload (see header).
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  const avatarUrl = `${publicBase}${path}`;

  try {
    await prisma.user.update({ where: { id: userId }, data: { image: avatarUrl } });
  } catch (dbError) {
    // The row didn't change, so the file we just stored is unreferenced.
    await storage.remove([path]).catch(() => {});
    throw dbError;
  }

  await deleteStoredAvatar(userId, current.image);

  return { avatarUrl };
}

/** Clears User.image, then deletes the stored file behind it. */
export async function removeUserAvatar(userId: string): Promise<void> {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  if (!current) {
    throw new AuthError(401, "Not authenticated.");
  }

  await prisma.user.update({ where: { id: userId }, data: { image: null } });
  await deleteStoredAvatar(userId, current.image);
}
