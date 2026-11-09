// src/lib/validation/auth.ts
//
// Input schemas for the auth endpoints. Server-side source of truth; the
// forms' own checks are for usability only.

import { z } from "zod";

/** bcrypt silently ignores everything past 72 BYTES, so cap in bytes. */
export const PASSWORD_MAX_BYTES = 72;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

const emailField = z.preprocess(
  (v) => (typeof v === "string" ? normalizeEmail(v) : v),
  z.email("Please enter a valid email address.").max(254, "That email is too long.")
);

/** For NEW passwords only (signup, reset). Never applied to login. */
export const newPasswordField = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine((v) => Buffer.byteLength(v, "utf8") <= PASSWORD_MAX_BYTES, {
    message: "That password is too long (72 bytes maximum).",
  });

const nameField = z
  .string()
  .trim()
  .min(1, "Please enter your name.")
  .max(100, "That name is too long.")
  .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), { message: "Invalid characters in name." });

/** 32 random bytes, base64url = 43 characters. */
const tokenField = z.string().regex(/^[A-Za-z0-9_-]{43}$/, "Invalid token.");

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  password: newPasswordField,
});

// Login must accept whatever password an existing account already has
// (older accounts may predate today's rules), so it only bounds length.
export const loginSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(1024),
});

export const emailOnlySchema = z.object({ email: emailField });

export const verifyEmailSchema = z.object({ token: tokenField });

export const resetPasswordSchema = z.object({
  token: tokenField,
  password: newPasswordField,
});
