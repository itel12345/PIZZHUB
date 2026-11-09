import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { DB_SKIP, testEmail } from "./helpers";

const HOUR = 3600_000;
const DAY = 24 * HOUR;

describe("database-backed sessions", { skip: DB_SKIP }, () => {
  let S: typeof import("../src/lib/session");
  let A: typeof import("../src/lib/auth");
  let prisma: typeof import("../src/lib/prisma").prisma;
  const created: string[] = [];

  async function makeUser(over: Record<string, unknown> = {}) {
    const u = await prisma.user.create({
      data: { name: "Test User", email: testEmail("sess"), password: "x-not-a-real-hash", ...over },
    });
    created.push(u.id);
    return u;
  }

  before(async () => {
    S = await import("../src/lib/session");
    A = await import("../src/lib/auth");
    ({ prisma } = await import("../src/lib/prisma"));
  });
  after(async () => {
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  it("generates 43-char url-safe unique tokens", () => {
    const a = S.generateToken();
    const b = S.generateToken();
    assert.match(a, /^[A-Za-z0-9_-]{43}$/);
    assert.notEqual(a, b);
  });

  it("stores ONLY the SHA-256 hash, never the token", async () => {
    const u = await makeUser();
    const { token, sessionId } = await S.createSession(u.id, { userAgent: "unit-test" });
    const row = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
    assert.equal(row.tokenHash, createHash("sha256").update(token).digest("hex"));
    assert.notEqual(row.tokenHash, token);
    assert.equal(JSON.stringify(row).includes(token), false);
  });

  it("validates a live session and returns the CURRENT user", async () => {
    const u = await makeUser();
    const { token } = await S.createSession(u.id);
    const v = await S.validateSessionToken(token);
    assert.ok(v);
    assert.equal(v.user.id, u.id);
    assert.equal(v.user.email, u.email);
    assert.equal(v.user.role, "USER");
  });

  it("rejects missing, malformed and unknown tokens identically (null)", async () => {
    for (const bad of [undefined, null, "", "short", " ".repeat(43), "A".repeat(43), "A".repeat(44), "../".repeat(20)]) {
      assert.equal(await S.validateSessionToken(bad as string | undefined), null, String(bad));
    }
  });

  it("expires after the idle window and deletes the dead row", async () => {
    const u = await makeUser();
    const { token, sessionId } = await S.createSession(u.id);
    const later = new Date(Date.now() + 15 * DAY); // idle limit is 14 days
    assert.equal(await S.validateSessionToken(token, later), null);
    assert.equal(await prisma.session.count({ where: { id: sessionId } }), 0);
  });

  it("slides the idle window on use, but throttles writes", async () => {
    const u = await makeUser();
    const t0 = new Date();
    const { token, sessionId } = await S.createSession(u.id, { now: t0 });
    const before = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });

    await S.validateSessionToken(token, new Date(t0.getTime() + 60_000)); // 1 min: no write
    const mid = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
    assert.equal(mid.lastUsedAt.getTime(), before.lastUsedAt.getTime());

    const t1 = new Date(t0.getTime() + 10 * 60_000); // 10 min: write
    await S.validateSessionToken(token, t1);
    const after_ = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
    assert.equal(after_.lastUsedAt.getTime(), t1.getTime());
    assert.ok(after_.expiresAt.getTime() > before.expiresAt.getTime());
  });

  it("enforces the 30-day absolute cap even for a constantly active session", async () => {
    const u = await makeUser();
    const t0 = new Date();
    const { token } = await S.createSession(u.id, { now: t0 });
    for (const d of [10, 20, 29]) {
      assert.ok(await S.validateSessionToken(token, new Date(t0.getTime() + d * DAY)), `day ${d}`);
    }
    assert.equal(await S.validateSessionToken(token, new Date(t0.getTime() + 31 * DAY)), null);
  });

  it("logout (revokeSessionByToken) kills the session and is idempotent", async () => {
    const u = await makeUser();
    const { token } = await S.createSession(u.id);
    assert.ok(await S.validateSessionToken(token));
    await S.revokeSessionByToken(token);
    assert.equal(await S.validateSessionToken(token), null);
    await S.revokeSessionByToken(token); // again: no throw
    await S.revokeSessionByToken("garbage");
    await S.revokeSessionByToken(undefined);
  });

  it("revokeAllSessionsForUser signs out everywhere except the kept session", async () => {
    const u = await makeUser();
    const other = await makeUser();
    const a = await S.createSession(u.id);
    const b = await S.createSession(u.id);
    const c = await S.createSession(u.id);
    const unrelated = await S.createSession(other.id);
    const n = await S.revokeAllSessionsForUser(u.id, b.sessionId);
    assert.equal(n, 2);
    assert.equal(await S.validateSessionToken(a.token), null);
    assert.ok(await S.validateSessionToken(b.token));
    assert.equal(await S.validateSessionToken(c.token), null);
    assert.ok(await S.validateSessionToken(unrelated.token), "other users untouched");
    await S.revokeAllSessionsForUser(u.id);
    assert.equal(await S.validateSessionToken(b.token), null);
  });

  it("reflects a role change on the very next request (no re-login)", async () => {
    const u = await makeUser();
    const { token } = await S.createSession(u.id);

    await assert.rejects(async () => A.authorizeAdminSession(await S.validateSessionToken(token)), (e: unknown) => e instanceof A.AuthError && e.status === 403);

    await prisma.user.update({ where: { id: u.id }, data: { role: "ADMIN" } });
    const admin = A.authorizeAdminSession(await S.validateSessionToken(token));
    assert.equal(admin.role, "ADMIN");
    assert.equal(admin.userId, u.id);

    await prisma.user.update({ where: { id: u.id }, data: { role: "USER" } });
    await assert.rejects(async () => A.authorizeAdminSession(await S.validateSessionToken(token)), (e: unknown) => e instanceof A.AuthError && e.status === 403);
  });

  it("admin access needs a session younger than 8 hours (401, not 403)", async () => {
    const u = await makeUser({ role: "ADMIN" });
    const { token } = await S.createSession(u.id, { now: new Date(Date.now() - 9 * HOUR) });
    const v = await S.validateSessionToken(token); // still a valid CUSTOMER session
    assert.ok(v);
    assert.throws(() => A.authorizeAdminSession(v), (e: unknown) => e instanceof A.AuthError && e.status === 401);

    const fresh = await S.createSession(u.id);
    assert.equal(A.authorizeAdminSession(await S.validateSessionToken(fresh.token)).role, "ADMIN");
  });

  it("authorizeAdminSession(null) is 401", () => {
    assert.throws(() => A.authorizeAdminSession(null), (e: unknown) => e instanceof A.AuthError && e.status === 401);
  });

  it("rejects (and removes) sessions of anonymised/deleted accounts", async () => {
    const u = await makeUser();
    const { token, sessionId } = await S.createSession(u.id);
    await prisma.user.update({ where: { id: u.id }, data: { email: `deleted-${u.id}@deleted.invalid` } });
    assert.equal(await S.validateSessionToken(token), null);
    assert.equal(await prisma.session.count({ where: { id: sessionId } }), 0);
  });

  it("a hard-deleted user's sessions disappear (FK cascade) and stop validating", async () => {
    const u = await makeUser();
    const { token } = await S.createSession(u.id);
    await prisma.user.delete({ where: { id: u.id } });
    assert.equal(await S.validateSessionToken(token), null);
  });

  it("pruneExpiredAuthRows removes expired sessions/tokens only", async () => {
    const u = await makeUser();
    const live = await S.createSession(u.id);
    const old = await S.createSession(u.id, { now: new Date(Date.now() - 20 * DAY) });
    await prisma.session.update({ where: { id: old.sessionId }, data: { expiresAt: new Date(Date.now() - HOUR) } });
    await S.pruneExpiredAuthRows();
    assert.ok(await S.validateSessionToken(live.token));
    assert.equal(await prisma.session.count({ where: { id: old.sessionId } }), 0);
  });
});
