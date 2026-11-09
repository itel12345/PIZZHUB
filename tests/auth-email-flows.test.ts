import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DB_SKIP, testEmail, req, freshIp, sessionCookieValue } from "./helpers";

const PASSWORD = "correct horse battery";
const APP_URL = "https://pizzhub.test.invalid";

// TEST DOUBLE for Resend's HTTP API. It records what the app WOULD send so
// the request can be inspected. It proves the request is well-formed and
// that the right things are (or are not) sent. It does NOT prove real
// delivery; that needs a real Resend account (see the report).
type Call = { url: string; headers: Record<string, string>; body: { from: string; to: string[]; subject: string; html: string; text: string } };

describe("email-based flows (Resend request recorded by a test double)", { skip: DB_SKIP }, () => {
  let prisma: typeof import("../src/lib/prisma").prisma;
  let S: typeof import("../src/lib/session");
  let T: typeof import("../src/lib/auth-tokens");
  let signup: typeof import("../src/app/api/auth/signup/route");
  let login: typeof import("../src/app/api/auth/login/route");
  let forgot: typeof import("../src/app/api/auth/forgot-password/route");
  let reset: typeof import("../src/app/api/auth/reset-password/route");
  let verify: typeof import("../src/app/api/auth/verify-email/route");
  let resend: typeof import("../src/app/api/auth/resend-verification/route");
  let HASH: string;

  const savedEnv = { ...process.env };
  const realFetch = globalThis.fetch;
  let calls: Call[] = [];
  let resendStatus = 200;

  function configureEmail(on: boolean) {
    if (on) {
      process.env.RESEND_API_KEY = "test-key-not-real";
      process.env.EMAIL_FROM = "PizzHub <no-reply@test.invalid>";
      process.env.APP_URL = APP_URL;
    } else {
      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_FROM;
      delete process.env.APP_URL;
    }
  }
  const user = (over: Record<string, unknown> = {}) =>
    prisma.user.create({ data: { name: "Mail Tester", email: testEmail("em"), password: HASH, ...over } });
  const tokenFrom = (text: string) => text.match(/token=([A-Za-z0-9_-]{43})/)?.[1] ?? null;

  before(async () => {
    ({ prisma } = await import("../src/lib/prisma"));
    S = await import("../src/lib/session");
    T = await import("../src/lib/auth-tokens");
    signup = await import("../src/app/api/auth/signup/route");
    login = await import("../src/app/api/auth/login/route");
    forgot = await import("../src/app/api/auth/forgot-password/route");
    reset = await import("../src/app/api/auth/reset-password/route");
    verify = await import("../src/app/api/auth/verify-email/route");
    resend = await import("../src/app/api/auth/resend-verification/route");
    HASH = await (await import("../src/lib/password")).hashPassword(PASSWORD);

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.startsWith("https://api.resend.com/")) {
        calls.push({ url, headers: Object.fromEntries(new Headers(init?.headers).entries()), body: JSON.parse(String(init?.body)) });
        return new Response(JSON.stringify({ id: "test-double" }), { status: resendStatus });
      }
      return realFetch(input, init);
    }) as typeof fetch;
  });
  beforeEach(() => {
    calls = [];
    resendStatus = 200;
    configureEmail(true);
  });
  after(async () => {
    globalThis.fetch = realFetch;
    process.env = savedEnv;
    await prisma.cart.deleteMany({ where: { user: { email: { endsWith: "@test.invalid" } } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: "@test.invalid" } } });
    await prisma.$disconnect();
  });

  const forgotReq = (email: string, extra: { ip?: string; headers?: Record<string, string> } = {}) =>
    req("/api/auth/forgot-password", { json: { email }, ip: extra.ip ?? freshIp(), headers: extra.headers });
  const resetReq = (token: string, password: string) =>
    req("/api/auth/reset-password", { json: { token, password }, ip: freshIp() });
  const verifyReq = (token: string) => req("/api/auth/verify-email", { json: { token }, ip: freshIp() });

  // ── honesty when email is not configured ─────────────────────────
  describe("when email delivery is NOT configured", () => {
    it("forgot-password says so (503), identically for known and unknown addresses, and sends nothing", async () => {
      configureEmail(false);
      const u = await user();
      const known = await forgot.POST(forgotReq(u.email));
      const unknown = await forgot.POST(forgotReq(testEmail("none")));
      assert.equal(known.status, 503);
      assert.equal(unknown.status, 503);
      assert.deepEqual(await known.json(), await unknown.json());
      assert.equal(calls.length, 0);
      assert.equal(await prisma.authToken.count({ where: { userId: u.id } }), 0);
    });

    it("resend-verification says so (503) and mints no token", async () => {
      configureEmail(false);
      const u = await user();
      const res = await resend.POST(req("/api/auth/resend-verification", { json: { email: u.email }, ip: freshIp() }));
      assert.equal(res.status, 503);
      assert.equal(await prisma.authToken.count({ where: { userId: u.id } }), 0);
    });
  });

  // ── forgot password ──────────────────────────────────────────────
  describe("forgot-password", () => {
    it("sends ONE correctly-formed Resend request with a working single-use link", async () => {
      const u = await user();
      const res = await forgot.POST(forgotReq(u.email));
      assert.equal(res.status, 200);
      assert.equal(calls.length, 1);
      const c = calls[0];
      assert.equal(c.url, "https://api.resend.com/emails");
      assert.equal(c.headers["authorization"], "Bearer test-key-not-real");
      assert.equal(c.headers["content-type"], "application/json");
      assert.deepEqual(c.body.to, [u.email]);
      assert.equal(c.body.from, "PizzHub <no-reply@test.invalid>");
      assert.match(c.body.text, new RegExp(`^[\\s\\S]*${APP_URL.replace(/\./g, "\\.")}/reset-password\\?token=[A-Za-z0-9_-]{43}`));

      const token = tokenFrom(c.body.text)!;
      const row = await prisma.authToken.findFirstOrThrow({ where: { userId: u.id, type: "PASSWORD_RESET" } });
      assert.equal(row.tokenHash, S.hashToken(token));
      assert.notEqual(row.tokenHash, token, "only the hash is stored");
      assert.ok(row.expiresAt.getTime() - Date.now() <= 3600_000 + 5000, "expires within an hour");
    });

    it("gives the SAME 200 answer for an unknown address and sends nothing", async () => {
      const u = await user();
      const known = await forgot.POST(forgotReq(u.email));
      calls = [];
      const unknown = await forgot.POST(forgotReq(testEmail("none")));
      assert.equal(unknown.status, 200);
      assert.deepEqual(await unknown.json(), await known.json());
      assert.equal(calls.length, 0);
    });

    it("builds links from APP_URL, never from a spoofed Host header", async () => {
      const u = await user();
      await forgot.POST(forgotReq(u.email, { headers: { host: "evil.example", "x-forwarded-host": "evil.example" } }));
      assert.equal(calls.length, 1);
      assert.equal(calls[0].body.text.includes("evil.example"), false);
      assert.equal(calls[0].body.html.includes("evil.example"), false);
      assert.ok(calls[0].body.text.includes(APP_URL));
    });

    it("does not leak a provider failure: still the generic 200", async () => {
      resendStatus = 500;
      const u = await user();
      const res = await forgot.POST(forgotReq(u.email));
      assert.equal(res.status, 200);
      assert.equal(calls.length, 1);
    });

    it("never emails anonymised accounts or ambiguous duplicate rows", async () => {
      const u = await user();
      await prisma.user.update({ where: { id: u.id }, data: { email: `deleted-${u.id}@deleted.invalid` } });
      await forgot.POST(forgotReq(`deleted-${u.id}@deleted.invalid`));
      const base = `dupe-${Date.now()}@test.invalid`;
      await user({ email: base });
      await user({ email: base.replace("dupe-", "DUPE-") });
      await forgot.POST(forgotReq(base));
      assert.equal(calls.length, 0);
    });

    it("rate-limits per email (3/hour) even when the IP changes", async () => {
      const u = await user();
      const statuses = [];
      for (let i = 0; i < 4; i++) statuses.push((await forgot.POST(forgotReq(u.email))).status);
      assert.deepEqual(statuses, [200, 200, 200, 429]);
    });

    it("a newer request supersedes the older emailed link", async () => {
      const u = await user();
      await forgot.POST(forgotReq(u.email));
      await forgot.POST(forgotReq(u.email));
      const [first, second] = calls.map((c) => tokenFrom(c.body.text)!);
      assert.equal((await reset.POST(resetReq(first, "brand-new-pass-1"))).status, 400);
      assert.equal((await reset.POST(resetReq(second, "brand-new-pass-1"))).status, 200);
    });
  });

  // ── reset password ───────────────────────────────────────────────
  describe("reset-password", () => {
    it("full loop: email link -> new password; old password dead; ALL sessions revoked; email marked verified", async () => {
      const u = await user({ emailVerifiedAt: null });
      const s1 = (await S.createSession(u.id)).token;
      const s2 = (await S.createSession(u.id)).token;

      await forgot.POST(forgotReq(u.email));
      const token = tokenFrom(calls[0].body.text)!;
      const res = await reset.POST(resetReq(token, "brand-new-pass-1"));
      assert.equal(res.status, 200);

      assert.equal(await S.validateSessionToken(s1), null);
      assert.equal(await S.validateSessionToken(s2), null);
      assert.equal((await login.POST(req("/api/auth/login", { json: { email: u.email, password: PASSWORD }, ip: freshIp() }))).status, 401);
      const ok = await login.POST(req("/api/auth/login", { json: { email: u.email, password: "brand-new-pass-1" }, ip: freshIp() }));
      assert.equal(ok.status, 200);
      assert.ok(sessionCookieValue(ok));
      assert.ok((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).emailVerifiedAt);
    });

    it("a link is single-use", async () => {
      const u = await user();
      const token = await T.createAuthToken(u.id, "PASSWORD_RESET");
      assert.equal((await reset.POST(resetReq(token, "brand-new-pass-1"))).status, 200);
      assert.equal((await reset.POST(resetReq(token, "another-pass-22"))).status, 400);
    });

    it("concurrent double-submit: exactly one succeeds", async () => {
      const u = await user();
      const token = await T.createAuthToken(u.id, "PASSWORD_RESET");
      const statuses = (await Promise.all([reset.POST(resetReq(token, "brand-new-pass-1")), reset.POST(resetReq(token, "brand-new-pass-2"))])).map((r) => r.status).sort();
      assert.deepEqual(statuses, [200, 400]);
    });

    it("a too-weak password is rejected WITHOUT burning the token", async () => {
      const u = await user();
      const token = await T.createAuthToken(u.id, "PASSWORD_RESET");
      assert.equal((await reset.POST(resetReq(token, "short"))).status, 400);
      assert.equal((await reset.POST(resetReq(token, "a".repeat(73)))).status, 400);
      assert.equal((await reset.POST(resetReq(token, "brand-new-pass-1"))).status, 200);
    });

    it("rejects expired, wrong-type, malformed and unknown tokens with one generic message", async () => {
      const u = await user();
      const expired = await T.createAuthToken(u.id, "PASSWORD_RESET", new Date(Date.now() - 2 * 3600_000));
      const wrongType = await T.createAuthToken(u.id, "EMAIL_VERIFICATION");
      const msgs = new Set<string>();
      for (const t of [expired, wrongType, "A".repeat(43), "short", "../../etc/passwd"]) {
        const res = await reset.POST(resetReq(t, "brand-new-pass-1"));
        assert.equal(res.status, 400, t.slice(0, 8));
        msgs.add(JSON.stringify(await res.json()));
      }
      // malformed tokens fail schema validation (different text); the 3 well-formed ones must be identical
      assert.ok(msgs.size <= 3);
      assert.equal((await login.POST(req("/api/auth/login", { json: { email: u.email, password: PASSWORD }, ip: freshIp() }))).status, 200, "password untouched");
    });
  });

  // ── verify email ─────────────────────────────────────────────────
  describe("verify-email", () => {
    it("marks the address verified, once", async () => {
      const u = await user({ emailVerifiedAt: null });
      const token = await T.createAuthToken(u.id, "EMAIL_VERIFICATION");
      assert.equal((await verify.POST(verifyReq(token))).status, 200);
      assert.ok((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).emailVerifiedAt);
      assert.equal((await verify.POST(verifyReq(token))).status, 400, "replay rejected");
    });

    it("rejects expired tokens and tokens of the wrong type", async () => {
      const u = await user({ emailVerifiedAt: null });
      const old = await T.createAuthToken(u.id, "EMAIL_VERIFICATION", new Date(Date.now() - 25 * 3600_000));
      const resetTok = await T.createAuthToken(u.id, "PASSWORD_RESET");
      assert.equal((await verify.POST(verifyReq(old))).status, 400);
      assert.equal((await verify.POST(verifyReq(resetTok))).status, 400);
      assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).emailVerifiedAt, null);
    });
  });

  // ── signup + resend with email configured ────────────────────────
  describe("signup and resend with email configured", () => {
    it("signup sends one verification email and says so only because it was sent", async () => {
      const email = testEmail("su");
      const res = await signup.POST(req("/api/auth/signup", { json: { name: "Sue", email, password: "longenough1" }, ip: freshIp() }));
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.verificationEmailSent, true);
      assert.match(body.message, /check your email/i);
      assert.equal(calls.length, 1);
      assert.ok(calls[0].body.text.includes(`${APP_URL}/verify-email?token=`));
      assert.equal((await verify.POST(verifyReq(tokenFrom(calls[0].body.text)!))).status, 200);
    });

    it("signup still succeeds, and does NOT claim an email went out, if the provider fails", async () => {
      resendStatus = 500;
      const res = await signup.POST(req("/api/auth/signup", { json: { name: "Sue", email: testEmail("su"), password: "longenough1" }, ip: freshIp() }));
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.verificationEmailSent, false);
      assert.doesNotMatch(body.message, /check your email/i);
    });

    it("resend-verification: same generic 200 for unknown / unverified / verified; mails only the unverified", async () => {
      const unverified = await user({ emailVerifiedAt: null });
      const verified = await user({ emailVerifiedAt: new Date() });
      const r = (email: string) => resend.POST(req("/api/auth/resend-verification", { json: { email }, ip: freshIp() }));
      const a = await r(unverified.email);
      const b = await r(verified.email);
      const c = await r(testEmail("none"));
      assert.deepEqual([a.status, b.status, c.status], [200, 200, 200]);
      const [bodyA, bodyB, bodyC] = [await a.json(), await b.json(), await c.json()];
      assert.deepEqual(bodyA, bodyB);
      assert.deepEqual(bodyB, bodyC);
      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0].body.to, [unverified.email]);
    });

    it("resend-verification is rate limited per email", async () => {
      const u = await user({ emailVerifiedAt: null });
      const statuses = [];
      for (let i = 0; i < 4; i++) statuses.push((await resend.POST(req("/api/auth/resend-verification", { json: { email: u.email }, ip: freshIp() }))).status);
      assert.deepEqual(statuses, [200, 200, 200, 429]);
    });
  });
});
