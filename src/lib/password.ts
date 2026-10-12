// src/lib/password.ts
//
// Pure password-hashing primitives — no Prisma, no session/auth
// concepts, no notion of "admin" vs "customer". Both
// lib/admin-account.ts (admin's own password) and lib/account.ts
// (a customer's own password) call into this instead of each keeping
// its own bcrypt.hash/compare + cost-factor constant, which is exactly
// the kind of thing that silently drifts out of sync (one file gets
// its cost factor bumped after a security review, the other quietly
// doesn't) if it's duplicated.
//
// Deliberately does NOT decide who is allowed to change whose
// password — that's an authorization question, and it's answered by
// the API route (requireAdmin / requireUser), never by which function
// in this file gets called. Nothing here should ever be treated as an
// authorization check by its name alone.

import "server-only";
import bcrypt from "bcrypt";

// Matches the cost factor already used by /api/auth/login and
// /api/auth/signup — every password hash in this app is produced at
// the same strength, regardless of which flow created it.
const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
