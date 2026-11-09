import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { DB_SKIP, uniq } from "./helpers";

describe("rate limiting (Postgres, atomic fixed window)", { skip: DB_SKIP }, () => {
  let R: typeof import("../src/lib/rate-limit");
  let prisma: typeof import("../src/lib/prisma").prisma;
  const rule = { limit: 3, windowSeconds: 60 };

  before(async () => {
    R = await import("../src/lib/rate-limit");
    ({ prisma } = await import("../src/lib/prisma"));
  });
  after(async () => {
    await prisma.$disconnect();
  });

  it("allows up to the limit, then blocks", async () => {
    const id = uniq("rl");
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await R.consumeRateLimit("test", id, rule));
    assert.deepEqual(results.map((r) => r.allowed), [true, true, true, false, false]);
    assert.deepEqual(results.map((r) => r.count), [1, 2, 3, 4, 5]);
  });

  it("reports a sane Retry-After", async () => {
    const id = uniq("rl");
    let r;
    for (let i = 0; i < 4; i++) r = await R.consumeRateLimit("test", id, rule);
    assert.equal(r!.allowed, false);
    assert.ok(r!.retryAfterSeconds >= 1 && r!.retryAfterSeconds <= 60, String(r!.retryAfterSeconds));
  });

  it("opens a fresh window once the old one has elapsed", async () => {
    const id = uniq("rl");
    const t0 = new Date();
    for (let i = 0; i < 4; i++) await R.consumeRateLimit("test", id, rule, t0);
    assert.equal((await R.consumeRateLimit("test", id, rule, new Date(t0.getTime() + 30_000))).allowed, false);
    const later = await R.consumeRateLimit("test", id, rule, new Date(t0.getTime() + 61_000));
    assert.equal(later.allowed, true);
    assert.equal(later.count, 1);
  });

  it("isolates keys by action and by identifier, case-insensitively", async () => {
    const id = uniq("rl");
    for (let i = 0; i < 4; i++) await R.consumeRateLimit("a", id, rule);
    assert.equal((await R.consumeRateLimit("b", id, rule)).count, 1, "different action");
    assert.equal((await R.consumeRateLimit("a", uniq("rl"), rule)).count, 1, "different identifier");
    assert.equal((await R.consumeRateLimit("a", id.toUpperCase(), rule)).count, 5, "same key ignoring case");
  });

  it("stays correct under concurrency (no lost updates)", async () => {
    const id = uniq("rl");
    const rs = await Promise.all(Array.from({ length: 12 }, () => R.consumeRateLimit("conc", id, { limit: 4, windowSeconds: 60 })));
    assert.equal(rs.filter((r) => r.allowed).length, 4);
    assert.deepEqual(rs.map((r) => r.count).sort((a, b) => a - b), Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it("stores only hashed keys, never the raw email/IP", async () => {
    const email = `${uniq("rl")}@test.invalid`;
    await R.consumeRateLimit("login:email", email, rule);
    const rows = await prisma.rateLimit.findMany({ where: { key: R.rateLimitKey("login:email", email) } });
    assert.equal(rows.length, 1);
    assert.match(rows[0].key, /^[0-9a-f]{64}$/);
    const dump = JSON.stringify(await prisma.rateLimit.findMany());
    assert.equal(dump.includes(email), false);
  });

  it("resetRateLimit clears a counter", async () => {
    const id = uniq("rl");
    for (let i = 0; i < 4; i++) await R.consumeRateLimit("reset", id, rule);
    await R.resetRateLimit("reset", id);
    assert.equal((await R.consumeRateLimit("reset", id, rule)).count, 1);
  });

  it("getClientIp uses the first X-Forwarded-For hop, then X-Real-IP", () => {
    assert.equal(R.getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4");
    assert.equal(R.getClientIp(new Headers({ "x-real-ip": "5.6.7.8" })), "5.6.7.8");
    assert.equal(R.getClientIp(new Headers()), "unknown");
  });
});
