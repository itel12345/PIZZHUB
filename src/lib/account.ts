// src/lib/account.ts
//
// Service layer for a customer managing their OWN account: password,
// marketing preferences, and deletion. Every function takes the userId
// that requireUser() already verified — nothing here accepts a userId
// from a request body, and nothing here decides *who* may act; that is
// the route's job (requireUser). The request-shape schemas live in
// lib/validation/account.ts; this file never parses raw input.
//
// Intentionally imports nothing from lib/admin-account.ts: customer and
// admin account management are separate audiences with separate auth
// mechanisms (see lib/auth.ts), and sharing an error class or helper
// across them would couple two features that change for unrelated
// reasons. Password hashing itself is shared via lib/password.ts so the
// cost factor can't drift between the two.

import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { AuthError, issueUserToken } from "./auth";
import { hashPassword, verifyPassword } from "./password";
import type {
  ChangeUserPasswordInput,
  MarketingPreferencesInput,
} from "./validation/account";

export class InvalidCurrentPasswordError extends Error {}
export class AdminAccountProtectedError extends Error {}

export interface MarketingPreferencesDTO {
  emailMarketingOptIn: boolean;
  smsMarketingOptIn: boolean;
}

// A user id that passed requireUser() but no longer has a row means the
// account was removed between the two calls. Reported as an auth failure
// (the routes already map AuthError to 401) rather than a new error type
// every route would need to learn about.
function accountMissing(): AuthError {
  return new AuthError(401, "Not authenticated.");
}

export async function getMarketingPreferences(
  userId: string
): Promise<MarketingPreferencesDTO> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailMarketingOptIn: true, smsMarketingOptIn: true },
  });

  if (!user) throw accountMissing();
  return user;
}

export async function updateMarketingPreferences(
  userId: string,
  input: MarketingPreferencesInput
): Promise<MarketingPreferencesDTO> {
  // Fields are copied one by one instead of spreading `input` into
  // `data`, so the only columns this function can ever write are the two
  // consent flags, whatever shape the caller passes in. `undefined`
  // leaves a column untouched, which is what makes a partial PATCH work.
  return prisma.user.update({
    where: { id: userId },
    data: {
      emailMarketingOptIn: input.emailMarketingOptIn,
      smsMarketingOptIn: input.smsMarketingOptIn,
    },
    select: { emailMarketingOptIn: true, smsMarketingOptIn: true },
  });
}

/**
 * Requires the current password, then sets the new one and bumps
 * authVersion so every OTHER outstanding session for this account stops
 * working immediately. The caller's own session would be killed by that
 * same bump, so a fresh token carrying the new authVersion is issued and
 * returned — the client must swap it in (see lib/auth.ts, requireUser).
 */
export async function changeUserPassword(
  userId: string,
  input: ChangeUserPasswordInput
): Promise<{ token: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) throw accountMissing();

  const isCurrentPasswordValid = await verifyPassword(input.currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new InvalidCurrentPasswordError("Current password is incorrect.");
  }

  const hashed = await hashPassword(input.newPassword);

  // `increment` is applied by the database, and the token is built from
  // the row it returns, so the token can never carry a stale authVersion
  // even if two changes race.
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, authVersion: { increment: 1 } },
    select: { id: true, email: true, authVersion: true },
  });

  return { token: issueUserToken(updated) };
}

/**
 * "Delete" here means anonymize + selectively hard-delete, never a raw
 * delete of the User row: Order.userId has no ON DELETE rule, and past
 * orders must stay for accounting. So the User row is kept but emptied
 * of anything identifying, and every table that only exists to serve
 * the person (cart, favorites, saved addresses, notifications) is
 * removed. authVersion is bumped so any session still holding a token
 * is rejected on its next request.
 *
 * Admin accounts are refused: deleting the last or the owner admin would
 * lock the store out of its own admin area. An admin must be demoted
 * from Admin Settings first.
 */
export async function deleteUserAccount(
  userId: string,
  currentPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, role: true },
  });
  if (!user) throw accountMissing();

  if (user.role === "ADMIN") {
    throw new AdminAccountProtectedError(
      "Admin accounts can't be deleted here. Ask the store owner to remove your admin access first."
    );
  }

  const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new InvalidCurrentPasswordError("Current password is incorrect.");
  }

  // The old hash is replaced by the hash of a random secret nobody ever
  // sees, so the anonymized row can never be logged into. Hashed before
  // the transaction because bcrypt is deliberately slow and a
  // transaction should not be held open for it.
  const unusablePasswordHash = await hashPassword(randomBytes(32).toString("hex"));

  await prisma.$transaction([
    prisma.cart.deleteMany({ where: { userId } }),
    prisma.favorite.deleteMany({ where: { userId } }),
    prisma.address.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        name: "Deleted user",
        // `.invalid` is a reserved TLD that can never receive mail, and
        // embedding the id keeps the column's UNIQUE constraint satisfied.
        email: `deleted-${userId}@deleted.invalid`,
        password: unusablePasswordHash,
        image: null,
        emailMarketingOptIn: false,
        smsMarketingOptIn: false,
        authVersion: { increment: 1 },
      },
    }),
  ]);
}