// src/lib/admin-account.ts
//
// Two related concerns kept in one file rather than split: "manage my
// own account" (password) and "manage who else is an admin" both
// operate on the same User.role/User.password surface and both belong
// to the Settings feature exclusively — no other part of the app reads
// or writes User.role or User.password outside of signup/login.

import "server-only";
import { prisma } from "./prisma";
import { getOwnerAdminEmail } from "./env";
import { hashPassword, verifyPassword } from "./password";

export class InvalidCurrentPasswordError extends Error {}
export class AccountNotFoundError extends Error {}
export class UserNotFoundError extends Error {}
export class AlreadyAdminError extends Error {}
export class LastAdminError extends Error {}
export class NotAnAdminError extends Error {}
export class OwnerProtectedError extends Error {}

function isOwnerEmail(email: string): boolean {
  return email.trim().toLowerCase() === getOwnerAdminEmail().trim().toLowerCase();
}

/**
 * Requires the caller to prove they know the CURRENT password before
 * setting a new one — this is what makes a stolen/left-open admin
 * session unable to silently take over the account by changing its
 * password, the same protection every "change password" flow needs.
 */
export async function changeAdminPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user) {
    // Should be unreachable — the caller just presented a valid
    // session referencing this exact id — but a deleted-in-between
    // race is not impossible, and this must not be assumed away.
    throw new AccountNotFoundError("Account not found.");
  }

  const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new InvalidCurrentPasswordError("Current password is incorrect.");
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}

export interface AdminListItem {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  /** True for the one account protected from removal by anyone,
   * including itself — see getOwnerAdminEmail(). Exposed as a plain
   * boolean so the UI can disable/explain the Remove button without
   * ever needing to know the actual owner email itself. */
  isOwner: boolean;
}

export async function listAdmins(): Promise<AdminListItem[]> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    joinedAt: admin.createdAt.toISOString(),
    isOwner: isOwnerEmail(admin.email),
  }));
}

/**
 * Promotes an existing customer (role=USER) to ADMIN by exact email
 * match. Deliberately does NOT create a new account — inventing one
 * here would bypass signup's own password-setting flow entirely,
 * which is a distinct concern this function has no business touching.
 * The person being promoted must already have a real account with a
 * real password they set themselves.
 */
export async function promoteUserToAdmin(email: string): Promise<AdminListItem> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new UserNotFoundError("No account found with that email.");
  }

  if (user.role === "ADMIN") {
    throw new AlreadyAdminError("This user is already an admin.");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    joinedAt: updated.createdAt.toISOString(),
    isOwner: isOwnerEmail(updated.email),
  };
}

/**
 * Demotes an admin back to a regular customer. Two hard safeguards,
 * both checked BEFORE any write happens:
 *
 *  - the ONE account matching OWNER_ADMIN_EMAIL can never be demoted,
 *    by anyone, including itself — this is the store's actual owner,
 *    not just "an admin", and no self-service action should be able
 *    to remove that account's access.
 *  - the last remaining admin can never be demoted (whether or not
 *    they're the owner), since that would leave the store with zero
 *    accounts able to manage it — an unrecoverable state without
 *    direct database access.
 *
 * Self-removal of a NON-owner admin is otherwise allowed (as long as
 * another admin remains) — it's that admin's own account, own choice,
 * and someone else is still there to run the store afterward.
 *
 * NOTE: this updates the User.role column immediately, but admin
 * sessions are signed JWTs with role baked in at login time (see
 * lib/auth.ts) — they are not re-verified against the database on
 * every request. Demoting yourself here does not revoke your CURRENT
 * browser session; you'll need to log out for the change to actually
 * take effect. The API route surfaces this in its response so the UI
 * can tell the person, rather than silently leaving them confused
 * about why they still appear to have access.
 */
export async function demoteAdmin(actingAdminId: string, targetUserId: string): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, email: true },
  });

  if (!target) {
    throw new UserNotFoundError("This user was not found.");
  }

  if (target.role !== "ADMIN") {
    throw new NotAnAdminError("This user is not currently an admin.");
  }

  if (isOwnerEmail(target.email)) {
    throw new OwnerProtectedError("This is the original admin account and can't be removed.");
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) {
    throw new LastAdminError(
      targetUserId === actingAdminId
        ? "You're the last remaining admin — promote someone else first."
        : "Can't remove the last remaining admin."
    );
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: "USER" },
  });
}