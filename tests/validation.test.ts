import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  signupSchema,
  loginSchema,
  emailOnlySchema,
  resetPasswordSchema,
  verifyEmailSchema,
  normalizeEmail,
} from "../src/lib/validation/auth";

const TOKEN = "A".repeat(43);

describe("auth input validation", () => {
  it("normalizes email (trim + lowercase) on signup", () => {
    const r = signupSchema.parse({ name: " Ama ", email: "  Ama@Example.COM ", password: "longenough1" });
    assert.equal(r.email, "ama@example.com");
    assert.equal(r.name, "Ama");
    assert.equal(normalizeEmail(" X@Y.Z "), "x@y.z");
  });

  it("rejects bad emails, short passwords and empty names", () => {
    assert.equal(signupSchema.safeParse({ name: "A", email: "nope", password: "longenough1" }).success, false);
    assert.equal(signupSchema.safeParse({ name: "A", email: "a@b.co", password: "short" }).success, false);
    assert.equal(signupSchema.safeParse({ name: "  ", email: "a@b.co", password: "longenough1" }).success, false);
    assert.equal(signupSchema.safeParse({ name: "A", email: "a".repeat(250) + "@b.co", password: "longenough1" }).success, false);
  });

  it("caps new passwords at 72 BYTES (bcrypt truncation), not characters", () => {
    const ok = "a".repeat(72);
    const tooLong = "a".repeat(73);
    const multibyte = "é".repeat(37); // 74 bytes, 37 characters
    assert.equal(signupSchema.safeParse({ name: "A", email: "a@b.co", password: ok }).success, true);
    assert.equal(signupSchema.safeParse({ name: "A", email: "a@b.co", password: tooLong }).success, false);
    assert.equal(signupSchema.safeParse({ name: "A", email: "a@b.co", password: multibyte }).success, false);
  });

  it("rejects control characters in names", () => {
    assert.equal(signupSchema.safeParse({ name: "A\u0000B", email: "a@b.co", password: "longenough1" }).success, false);
  });

  it("login accepts legacy short passwords but bounds length", () => {
    assert.equal(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success, true);
    assert.equal(loginSchema.safeParse({ email: "a@b.co", password: "x".repeat(1025) }).success, false);
    assert.equal(loginSchema.safeParse({ email: "", password: "x" }).success, false);
    assert.equal(loginSchema.safeParse({ email: "a@b.co" }).success, false);
  });

  it("validates reset and verify tokens strictly", () => {
    assert.equal(resetPasswordSchema.safeParse({ token: TOKEN, password: "longenough1" }).success, true);
    assert.equal(resetPasswordSchema.safeParse({ token: "short", password: "longenough1" }).success, false);
    assert.equal(resetPasswordSchema.safeParse({ token: TOKEN + "!", password: "longenough1" }).success, false);
    assert.equal(resetPasswordSchema.safeParse({ token: TOKEN, password: "short" }).success, false);
    assert.equal(verifyEmailSchema.safeParse({ token: TOKEN }).success, true);
    assert.equal(verifyEmailSchema.safeParse({ token: "../etc/passwd" }).success, false);
  });

  it("emailOnly normalizes", () => {
    assert.equal(emailOnlySchema.parse({ email: " A@B.CO " }).email, "a@b.co");
  });
});
