import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  requestPasswordReset,
  resendVerificationEmail,
  confirmEmail,
  resetPassword,
  validateNewPassword,
  NETWORK_MESSAGE,
  UNKNOWN_MESSAGE,
  RATE_LIMIT_MESSAGE,
  EMAIL_NOT_VERIFIED_CODE,
} from "../src/lib/auth-client";

// Pure unit tests: global fetch is replaced so we can control exactly what
// the "server" answers and inspect what the browser would have sent.
describe("browser auth helpers (what the forms and pages display)", () => {
  const realFetch = globalThis.fetch;
  let sent: { url: string; init: RequestInit }[] = [];

  function server(status: number, body: unknown, headers: Record<string, string> = {}) {
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      sent.push({ url: String(url), init: init ?? {} });
      const payload = typeof body === "string" ? body : JSON.stringify(body);
      return new Response(payload, { status, headers });
    }) as typeof fetch;
  }
  beforeEach(() => { sent = []; });
  afterEach(() => { globalThis.fetch = realFetch; });

  it("posts JSON to the right endpoint with the right body", async () => {
    server(200, { success: true, message: "ok" });
    await requestPasswordReset("a@b.co");
    await resendVerificationEmail("a@b.co");
    await confirmEmail("T".repeat(43));
    await resetPassword("T".repeat(43), "newpassword1");
    assert.deepEqual(sent.map((s) => s.url), [
      "/api/auth/forgot-password",
      "/api/auth/resend-verification",
      "/api/auth/verify-email",
      "/api/auth/reset-password",
    ]);
    for (const s of sent) {
      assert.equal(s.init.method, "POST");
      assert.deepEqual(s.init.headers, { "Content-Type": "application/json" });
    }
    assert.deepEqual(JSON.parse(String(sent[0].init.body)), { email: "a@b.co" });
    assert.deepEqual(JSON.parse(String(sent[3].init.body)), { token: "T".repeat(43), password: "newpassword1" });
  });

  it("success only on a 2xx answer, carrying the server's message", async () => {
    server(200, { success: true, message: "A link is on its way." });
    const r = await requestPasswordReset("a@b.co");
    assert.deepEqual(r, { ok: true, message: "A link is on its way." });
  });

  it("a 2xx with an empty/non-JSON body is still success (empty message)", async () => {
    server(200, "");
    assert.deepEqual(await confirmEmail("T".repeat(43)), { ok: true, message: "" });
  });

  it("503 (email not configured) is reported as unavailable with the server's honest text, never as success", async () => {
    server(503, { error: "Password reset by email isn't available yet. Please contact the store." });
    const r = await requestPasswordReset("a@b.co");
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.kind, "unavailable");
    assert.match(r.ok === false ? r.message : "", /isn't available yet/);
  });

  it("429 is rate_limited and carries Retry-After", async () => {
    server(429, { error: "Too many attempts. Please wait a while and try again." }, { "Retry-After": "120" });
    const r = await requestPasswordReset("a@b.co");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.kind, "rate_limited");
      assert.equal(r.retryAfterSeconds, 120);
    }
    server(429, {});
    const r2 = await resendVerificationEmail("a@b.co");
    assert.equal(r2.ok === false && r2.message, RATE_LIMIT_MESSAGE);
  });

  it("400 INVALID_TOKEN is invalid_link; other 400s are invalid_input", async () => {
    server(400, { error: "This reset link is invalid or has expired.", code: "INVALID_TOKEN" });
    const a = await resetPassword("T".repeat(43), "newpassword1");
    assert.equal(a.ok === false && a.kind, "invalid_link");

    server(400, { error: "Password must be at least 8 characters.", code: "INVALID_PASSWORD" });
    const b = await resetPassword("T".repeat(43), "short");
    assert.equal(b.ok === false && b.kind, "invalid_input");
    assert.equal(b.ok === false && b.message, "Password must be at least 8 characters.");

    server(400, { error: "This verification link is invalid or has expired.", code: "INVALID_TOKEN" });
    const c = await confirmEmail("T".repeat(43));
    assert.equal(c.ok === false && c.kind, "invalid_link");
  });

  it("network failures never look like success", async () => {
    globalThis.fetch = (async () => { throw new TypeError("Failed to fetch"); }) as typeof fetch;
    for (const r of [await requestPasswordReset("a@b.co"), await resetPassword("T".repeat(43), "newpassword1"), await confirmEmail("T".repeat(43)), await resendVerificationEmail("a@b.co")]) {
      assert.equal(r.ok, false);
      assert.equal(r.ok === false && r.kind, "network");
      assert.equal(r.ok === false && r.message, NETWORK_MESSAGE);
    }
  });

  it("unexpected server errors (500, HTML body) become a generic, honest failure", async () => {
    server(500, "<html>boom</html>");
    const r = await requestPasswordReset("a@b.co");
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.kind, "unknown");
    assert.equal(r.ok === false && r.message, UNKNOWN_MESSAGE);
    server(401, { error: "Not authenticated." });
    assert.equal((await confirmEmail("T".repeat(43))).ok, false);
  });

  it("client-side password check matches the server's rules (8+ chars, 72 BYTES max)", () => {
    assert.equal(validateNewPassword("short"), "Password must be at least 8 characters.");
    assert.equal(validateNewPassword("longenough1"), null);
    assert.equal(validateNewPassword("a".repeat(72)), null);
    assert.match(validateNewPassword("a".repeat(73)) ?? "", /too long/);
    assert.match(validateNewPassword("é".repeat(37)) ?? "", /too long/); // 74 bytes
  });

  it("exposes the exact code the login route returns for unverified accounts", () => {
    assert.equal(EMAIL_NOT_VERIFIED_CODE, "EMAIL_NOT_VERIFIED");
  });
});
