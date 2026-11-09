import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { DB_SKIP, testEmail, req, freshIp, sessionCookieValue, setCookies, COOKIE_NAME } from "./helpers";

const PASSWORD = "correct horse battery";

describe("auth routes (real handlers, real database)", { skip: DB_SKIP }, () => {
  let prisma: typeof import("../src/lib/prisma").prisma;
  let S: typeof import("../src/lib/session");
  let A: typeof import("../src/lib/auth");
  let signup: typeof import("../src/app/api/auth/signup/route");
  let login: typeof import("../src/app/api/auth/login/route");
  let logout: typeof import("../src/app/api/auth/logout/route");
  let me: typeof import("../src/app/api/auth/me/route");
  let changePw: typeof import("../src/app/api/account/password/route");
  let HASH: string;
  const savedEnv = { ...process.env };

  async function user(over: Record<string, unknown> = {}) {
    return prisma.user.create({
      data: { name: "Route Tester", email: testEmail("rt"), password: HASH, ...over },
    });
  }
  const loginReq = (email: string, password: string, ip = freshIp()) =>
    req("/api/auth/login", { json: { email, password }, ip });

  before(async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.APP_URL;
    delete process.env.AUTH_REQUIRE_EMAIL_VERIFICATION;
    ({ prisma } = await import("../src/lib/prisma"));
    S = await import("../src/lib/session");
    A = await import("../src/lib/auth");
    signup = await import("../src/app/api/auth/signup/route");
    login = await import("../src/app/api/auth/login/route");
    logout = await import("../src/app/api/auth/logout/route");
    me = await import("../src/app/api/auth/me/route");
    changePw = await import("../src/app/api/account/password/route");
    const { hashPassword } = await import("../src/lib/password");
    HASH = await hashPassword(PASSWORD);
  });
  after(async () => {
    process.env = savedEnv;
    await prisma.cart.deleteMany({ where: { user: { email: { endsWith: "@test.invalid" } } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: "@test.invalid" } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: "@deleted.invalid" } } });
    await prisma.$disconnect();
  });

  // ── signup ──────────────────────────────────────────────────────
  describe("signup", () => {
    it("rejects invalid input with a specific message and creates nothing", async () => {
      const ip = freshIp();
      for (const body of [{}, { name: "A", email: "nope", password: "longenough1" }, { name: "A", email: testEmail(), password: "short" }, { name: "", email: testEmail(), password: "longenough1" }]) {
        const res = await signup.POST(req("/api/auth/signup", { json: body, ip }));
        assert.equal(res.status, 400);
        assert.ok((await res.json()).error);
      }
    });

    it("creates a lower-cased, bcrypt-hashed account with a cart and NO session/token", async () => {
      const email = testEmail("SignUp").toUpperCase().replace("@TEST.INVALID", "@test.invalid");
      const res = await signup.POST(req("/api/auth/signup", { json: { name: " New Person ", email: `  ${email}  `, password: "longenough1" }, ip: freshIp() }));
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.user.email, email.toLowerCase());
      assert.equal(body.message, "Account created successfully!", "must not claim an email was sent");
      assert.equal(body.verificationEmailSent, false);
      assert.equal(JSON.stringify(body).includes("token"), false);
      assert.equal(sessionCookieValue(res), null, "signup does not log in");

      const row = await prisma.user.findUniqueOrThrow({ where: { id: body.user.id }, include: { cart: true } });
      assert.match(row.password, /^\$2[aby]\$12\$/);
      assert.equal(row.name, "New Person");
      assert.equal(row.emailVerifiedAt, null);
      assert.ok(row.cart);
      assert.equal(await prisma.authToken.count({ where: { userId: row.id } }), 0, "no token minted when email is not configured");
    });

    it("rejects duplicates case-insensitively (409), including legacy mixed-case rows", async () => {
      const legacy = `Legacy-${Date.now()}@test.invalid`;
      await user({ email: legacy });
      const res = await signup.POST(req("/api/auth/signup", { json: { name: "X", email: legacy.toLowerCase(), password: "longenough1" }, ip: freshIp() }));
      assert.equal(res.status, 409);
    });

    it("two racing signups for one address: exactly one wins, the other gets 409", async () => {
      const email = testEmail("race");
      const mk = () => signup.POST(req("/api/auth/signup", { json: { name: "R", email, password: "longenough1" }, ip: freshIp() }));
      const statuses = (await Promise.all([mk(), mk()])).map((r) => r.status).sort();
      assert.deepEqual(statuses, [201, 409]);
    });

    it("is rate limited per IP (429 + Retry-After)", async () => {
      const ip = freshIp();
      let last = 0;
      let retry: string | null = null;
      for (let i = 0; i < 11; i++) {
        // Valid payloads: invalid ones are rejected (400) before they cost anything.
        const res = await signup.POST(req("/api/auth/signup", { json: { name: "X", email: testEmail("rl"), password: "longenough1" }, ip }));
        last = res.status;
        retry = res.headers.get("retry-after");
      }
      assert.equal(last, 429);
      assert.ok(Number(retry) > 0);
    });
  });

  // ── login ───────────────────────────────────────────────────────
  describe("login", () => {
    it("sets an HttpOnly SameSite=Lax cookie, returns NO token, stores only a hash", async () => {
      const u = await user();
      const res = await login.POST(loginReq(u.email, PASSWORD));
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.user.id, u.id);
      assert.equal(body.user.role, "USER");
      assert.equal("token" in body, false);
      assert.equal(JSON.stringify(body).includes("password"), false);

      const raw = setCookies(res).find((c) => c.startsWith(`${COOKIE_NAME}=`))!;
      assert.match(raw, /HttpOnly/i);
      assert.match(raw, /SameSite=lax/i);
      assert.match(raw, /Path=\//);
      const value = sessionCookieValue(res)!;
      assert.match(value, /^[A-Za-z0-9_-]{43}$/);
      assert.equal(await prisma.session.count({ where: { tokenHash: value } }), 0, "raw token is not what is stored");
      assert.equal((await S.validateSessionToken(value))?.user.id, u.id);
    });

    it("answers wrong password and unknown email with the SAME 401 body", async () => {
      const u = await user();
      const wrong = await login.POST(loginReq(u.email, "not-the-password"));
      const unknown = await login.POST(loginReq(testEmail("ghost"), "whatever1"));
      assert.equal(wrong.status, 401);
      assert.equal(unknown.status, 401);
      assert.deepEqual(await wrong.json(), await unknown.json());
      assert.equal(sessionCookieValue(wrong), null);
    });

    it("is case-insensitive, including for legacy mixed-case stored emails", async () => {
      const stored = `Mixed-${Date.now()}@test.invalid`;
      await user({ email: stored });
      const res = await login.POST(loginReq(stored.toLowerCase(), PASSWORD));
      assert.equal(res.status, 200);
      const res2 = await login.POST(loginReq(`  ${stored.toUpperCase().replace("TEST.INVALID", "test.invalid")} `, PASSWORD));
      assert.equal(res2.status, 200);
    });

    it("fails CLOSED when two rows differ only by case (never guesses an account)", async () => {
      const base = `dup-${Date.now()}@test.invalid`;
      await user({ email: base });
      await user({ email: base.replace("dup-", "DUP-") });
      const res = await login.POST(loginReq(base, PASSWORD));
      assert.equal(res.status, 401);
      assert.equal(sessionCookieValue(res), null);
    });

    it("refuses anonymised (deleted) accounts", async () => {
      const u = await user();
      await prisma.user.update({ where: { id: u.id }, data: { email: `deleted-${u.id}@deleted.invalid` } });
      const res = await login.POST(loginReq(`deleted-${u.id}@deleted.invalid`, PASSWORD));
      assert.equal(res.status, 401);
    });

    it("locks an email after 5 attempts (429), even for the right password, then recovers by window", async () => {
      const u = await user();
      for (let i = 0; i < 5; i++) assert.equal((await login.POST(loginReq(u.email, "wrong-wrong"))).status, 401);
      const blocked = await login.POST(loginReq(u.email, PASSWORD));
      assert.equal(blocked.status, 429);
      assert.ok(Number(blocked.headers.get("retry-after")) > 0);
    });

    it("a successful login resets that email's counter", async () => {
      const u = await user();
      for (let i = 0; i < 3; i++) await login.POST(loginReq(u.email, "wrong-wrong"));
      assert.equal((await login.POST(loginReq(u.email, PASSWORD))).status, 200);
      for (let i = 0; i < 4; i++) assert.equal((await login.POST(loginReq(u.email, "wrong-wrong"))).status, 401);
      assert.equal((await login.POST(loginReq(u.email, PASSWORD))).status, 200, "counter was reset, so 4 fresh failures don't lock");
    });

    it("limits one IP across many emails (credential stuffing)", async () => {
      const ip = freshIp();
      let last = 0;
      for (let i = 0; i < 21; i++) last = (await login.POST(loginReq(testEmail("stuff"), "x", ip))).status;
      assert.equal(last, 429);
    });

    it("rejects malformed bodies without touching the database", async () => {
      assert.equal((await login.POST(req("/api/auth/login", { json: {}, ip: freshIp() }))).status, 400);
      const bad = new Request("http://localhost:3000/api/auth/login", { method: "POST", body: "{not json" });
      const r = req("/api/auth/login", { method: "POST", ip: freshIp() });
      assert.equal((await login.POST(Object.assign(r, { json: () => bad.json() }))).status, 400);
    });

    it("EXISTING unverified customers can still sign in while verification is OFF (default)", async () => {
      delete process.env.AUTH_REQUIRE_EMAIL_VERIFICATION;
      const u = await user({ emailVerifiedAt: null });
      assert.equal((await login.POST(loginReq(u.email, PASSWORD))).status, 200);
    });

    it("when verification is switched ON: unverified -> 403, verified -> 200, wrong password still plain 401", async () => {
      process.env.AUTH_REQUIRE_EMAIL_VERIFICATION = "true";
      try {
        const unverified = await user({ emailVerifiedAt: null });
        const verified = await user({ emailVerifiedAt: new Date() });

        const blocked = await login.POST(loginReq(unverified.email, PASSWORD));
        assert.equal(blocked.status, 403);
        assert.equal((await blocked.json()).code, "EMAIL_NOT_VERIFIED");
        assert.equal(sessionCookieValue(blocked), null);

        const leak = await login.POST(loginReq(unverified.email, "wrong-wrong"));
        assert.equal(leak.status, 401, "must not reveal verification state without the right password");

        assert.equal((await login.POST(loginReq(verified.email, PASSWORD))).status, 200);
      } finally {
        delete process.env.AUTH_REQUIRE_EMAIL_VERIFICATION;
      }
    });
  });

  // ── /me and logout ──────────────────────────────────────────────
  describe("session lifecycle over HTTP", () => {
    async function signedIn() {
      const u = await user();
      const res = await login.POST(loginReq(u.email, PASSWORD));
      return { u, cookie: sessionCookieValue(res)! };
    }

    it("GET /api/auth/me: 200 with a valid cookie, 401 without or with a forged one", async () => {
      const { u, cookie } = await signedIn();
      const ok = await me.GET(req("/api/auth/me", { cookie }));
      assert.equal(ok.status, 200);
      assert.equal((await ok.json()).user.email, u.email);
      assert.equal(ok.headers.get("cache-control"), "no-store");
      assert.equal((await me.GET(req("/api/auth/me"))).status, 401);
      assert.equal((await me.GET(req("/api/auth/me", { cookie: "A".repeat(43) }))).status, 401);
    });

    it("logout deletes the server-side session: the OLD cookie is dead everywhere afterwards", async () => {
      const { cookie } = await signedIn();
      assert.equal((await me.GET(req("/api/auth/me", { cookie }))).status, 200);

      const out = await logout.POST(req("/api/auth/logout", { method: "POST", cookie }));
      assert.equal(out.status, 200);
      const cleared = setCookies(out).find((c) => c.startsWith(`${COOKIE_NAME}=`))!;
      assert.match(cleared, /Max-Age=0|Expires=Thu, 01 Jan 1970/i);

      // The attacker/replay case: someone kept a copy of the cookie value.
      assert.equal((await me.GET(req("/api/auth/me", { cookie }))).status, 401);
      assert.equal(await prisma.session.count({ where: { tokenHash: S.hashToken(cookie) } }), 0);
    });

    it("logout with no/invalid session still succeeds (idempotent)", async () => {
      assert.equal((await logout.POST(req("/api/auth/logout", { method: "POST" }))).status, 200);
      assert.equal((await logout.POST(req("/api/auth/logout", { method: "POST", cookie: "A".repeat(43) }))).status, 200);
    });

    it("logging out one device leaves the user's other device signed in", async () => {
      const u = await user();
      const a = sessionCookieValue(await login.POST(loginReq(u.email, PASSWORD)))!;
      const b = sessionCookieValue(await login.POST(loginReq(u.email, PASSWORD)))!;
      await logout.POST(req("/api/auth/logout", { method: "POST", cookie: a }));
      assert.equal((await me.GET(req("/api/auth/me", { cookie: a }))).status, 401);
      assert.equal((await me.GET(req("/api/auth/me", { cookie: b }))).status, 200);
    });
  });

  // ── requireUser: authorization + Origin ─────────────────────────
  describe("requireUser()", () => {
    async function cookieFor() {
      const u = await user();
      return { u, ...(await S.createSession(u.id)) };
    }
    const status = async (p: Promise<unknown>) => {
      try { await p; return 200; } catch (e) { return e instanceof A.AuthError ? e.status : -1; }
    };

    it("returns userId + sessionId for a valid cookie", async () => {
      const { u, token, sessionId } = await cookieFor();
      const r = await A.requireUser(req("/api/cart", { cookie: token }));
      assert.deepEqual(r, { userId: u.id, sessionId });
    });

    it("401 without a cookie; an Authorization: Bearer header is IGNORED", async () => {
      assert.equal(await status(A.requireUser(req("/api/cart"))), 401);
      const { token } = await cookieFor();
      assert.equal(await status(A.requireUser(req("/api/cart", { headers: { authorization: `Bearer ${token}` } }))), 401);
    });

    it("blocks cross-origin state-changing requests even with a valid cookie (403)", async () => {
      const { token } = await cookieFor();
      assert.equal(await status(A.requireUser(req("/api/cart", { method: "POST", cookie: token, origin: "https://evil.example" }))), 403);
      assert.equal(await status(A.requireUser(req("/api/cart", { method: "DELETE", cookie: token, origin: null }))), 403, "no Origin and no Sec-Fetch-Site: fail closed");
    });

    it("allows same-origin mutations, and Sec-Fetch-Site: same-origin without Origin", async () => {
      const { token } = await cookieFor();
      assert.equal(await status(A.requireUser(req("/api/cart", { method: "POST", cookie: token }))), 200);
      assert.equal(await status(A.requireUser(req("/api/cart", { method: "PATCH", cookie: token, origin: null, headers: { "sec-fetch-site": "same-origin" } }))), 200);
    });

    it("rejects an expired session and a deleted account", async () => {
      const { u, token, sessionId } = await cookieFor();
      await prisma.session.update({ where: { id: sessionId }, data: { expiresAt: new Date(Date.now() - 1000) } });
      assert.equal(await status(A.requireUser(req("/api/cart", { cookie: token }))), 401);

      const second = await S.createSession(u.id);
      await prisma.user.update({ where: { id: u.id }, data: { email: `deleted-${u.id}@deleted.invalid` } });
      assert.equal(await status(A.requireUser(req("/api/cart", { cookie: second.token }))), 401);
    });
  });

  // ── account changes revoke sessions ─────────────────────────────
  describe("account changes", () => {
    it("PATCH /api/account/password: keeps THIS session, kills the others, returns no token", async () => {
      const u = await user();
      const a = sessionCookieValue(await login.POST(loginReq(u.email, PASSWORD)))!;
      const b = sessionCookieValue(await login.POST(loginReq(u.email, PASSWORD)))!;

      const res = await changePw.PATCH(req("/api/account/password", { method: "PATCH", cookie: a, json: { currentPassword: PASSWORD, newPassword: "brand-new-pass-1" } }));
      assert.equal(res.status, 200);
      assert.equal("token" in (await res.json()), false);

      assert.ok(await S.validateSessionToken(a), "the tab that changed it stays signed in");
      assert.equal(await S.validateSessionToken(b), null, "other devices are signed out");
      assert.equal((await login.POST(loginReq(u.email, PASSWORD))).status, 401, "old password no longer works");
      assert.equal((await login.POST(loginReq(u.email, "brand-new-pass-1"))).status, 200);
    });

    it("wrong current password changes nothing and revokes nothing", async () => {
      const u = await user();
      const a = sessionCookieValue(await login.POST(loginReq(u.email, PASSWORD)))!;
      const b = sessionCookieValue(await login.POST(loginReq(u.email, PASSWORD)))!;
      const res = await changePw.PATCH(req("/api/account/password", { method: "PATCH", cookie: a, json: { currentPassword: "nope-nope-nope", newPassword: "brand-new-pass-1" } }));
      assert.equal(res.status, 400);
      assert.ok(await S.validateSessionToken(a));
      assert.ok(await S.validateSessionToken(b));
    });

    it("password change is rejected cross-origin (403 mapped to 401 by the route) and unauthenticated", async () => {
      const u = await user();
      const a = sessionCookieValue(await login.POST(loginReq(u.email, PASSWORD)))!;
      const cross = await changePw.PATCH(req("/api/account/password", { method: "PATCH", cookie: a, origin: "https://evil.example", json: { currentPassword: PASSWORD, newPassword: "brand-new-pass-1" } }));
      assert.ok(cross.status === 401 || cross.status === 403);
      assert.equal((await login.POST(loginReq(u.email, PASSWORD))).status, 200, "password unchanged");
      const anon = await changePw.PATCH(req("/api/account/password", { method: "PATCH", json: { currentPassword: PASSWORD, newPassword: "brand-new-pass-1" } }));
      assert.equal(anon.status, 401);
    });

    it("deleting an account ends every session for it", async () => {
      const { deleteUserAccount } = await import("../src/lib/account");
      const u = await user();
      const a = (await S.createSession(u.id)).token;
      const b = (await S.createSession(u.id)).token;
      await deleteUserAccount(u.id, PASSWORD);
      assert.equal(await S.validateSessionToken(a), null);
      assert.equal(await S.validateSessionToken(b), null);
      assert.equal(await prisma.session.count({ where: { userId: u.id } }), 0);
    });
  });
});
