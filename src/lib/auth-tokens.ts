// src/lib/auth-tokens.ts
//
// Server-only. Single-use email-verification and password-reset tokens.
// Same storage rule as sessions: the raw token exists only in the email
// link; the database keeps its SHA-256 hash.

import "server-only";
import type { AuthTokenType } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { generateToken, hashToken, looksLikeToken } from "./session";

export const TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};

/**
 * Issues a fresh token and supersedes every older unused token of the
 * same type for that user, so only the newest emailed link works.
 */
export async function createAuthToken(
  userId: string,
  type: AuthTokenType,
  now: Date = new Date()
): Promise<string> {
  const token = generateToken();
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(token),
        expiresAt: new Date(now.getTime() + TOKEN_TTL_MS[type]),
        createdAt: now,
      },
    }),
  ]);
  return token;
}

/**
 * Atomically spends a token. Returns the owning userId, or null if it is
 * unknown, of the wrong type, expired or already used. The
 * `updateMany ... usedAt: null` guard makes concurrent double-clicks safe:
 * exactly one caller sees count === 1.
 */
export async function consumeAuthToken(
  rawToken: string,
  type: AuthTokenType,
  now: Date = new Date()
): Promise<string | null> {
  if (!looksLikeToken(rawToken)) return null;

  const row = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    select: { id: true, userId: true, type: true, expiresAt: true, usedAt: true },
  });
  if (!row || row.type !== type || row.usedAt !== null) return null;
  if (row.expiresAt.getTime() <= now.getTime()) return null;

  const spent = await prisma.authToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: now },
  });
  return spent.count === 1 ? row.userId : null;
}
