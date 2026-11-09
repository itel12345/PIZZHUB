// tests/helpers.ts
//
// SAFETY: these tests never read DATABASE_URL. Database-backed tests use
// TEST_DATABASE_URL and REFUSE to run unless it points at this machine
// (localhost / 127.0.0.1) and the database name contains "test" or
// "scratch". Production credentials sitting in .env cannot be used by
// accident. Without TEST_DATABASE_URL the database tests are reported as
// SKIPPED (not passed).

export type TestDb = { ok: true; url: string } | { ok: false; reason: string };

export function resolveTestDb(): TestDb {
  const raw = process.env.TEST_DATABASE_URL;
  if (!raw) return { ok: false, reason: "TEST_DATABASE_URL is not set" };
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: "TEST_DATABASE_URL is not a valid URL" };
  }
  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  if (!localHosts.has(u.hostname)) {
    return { ok: false, reason: `refusing: host "${u.hostname}" is not local` };
  }
  const dbName = u.pathname.replace(/^\//, "");
  if (!/test|scratch/i.test(dbName)) {
    return { ok: false, reason: `refusing: database "${dbName}" must contain "test" or "scratch"` };
  }
  // Point the app's Prisma client (src/lib/prisma.ts reads DATABASE_URL)
  // at the guarded test database BEFORE any app module is imported.
  process.env.DATABASE_URL = raw;
  process.env.DIRECT_URL = raw;
  return { ok: true, url: raw };
}

export const TEST_DB = resolveTestDb();
export const DB_SKIP: string | false = TEST_DB.ok ? false : TEST_DB.reason;

export const ORIGIN = "http://localhost:3000";

export function uniq(prefix = "u"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function testEmail(prefix = "u"): string {
  return `${uniq(prefix)}@test.invalid`;
}

// ── request helpers for route-handler tests ─────────────────────────
import { NextRequest } from "next/server";

export const COOKIE_NAME = "pizzhub_session"; // non-production name

let ipCounter = 0;
/** A unique client IP per call so per-IP rate limits don't bleed between tests. */
export function freshIp(): string {
  ipCounter += 1;
  return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${ipCounter & 255}`;
}

export function req(
  path: string,
  opts: {
    method?: string;
    json?: unknown;
    cookie?: string;
    ip?: string;
    origin?: string | null;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const method = opts.method ?? (opts.json !== undefined ? "POST" : "GET");
  const headers = new Headers({ host: "localhost:3000", ...(opts.headers ?? {}) });
  if (method !== "GET" && opts.origin !== null) headers.set("origin", opts.origin ?? ORIGIN);
  if (opts.ip !== undefined) headers.set("x-forwarded-for", opts.ip);
  if (opts.cookie) headers.set("cookie", `${COOKIE_NAME}=${opts.cookie}`);
  if (opts.json !== undefined) headers.set("content-type", "application/json");
  return new NextRequest(ORIGIN + path, {
    method,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
  });
}

export function setCookies(res: Response): string[] {
  return res.headers.getSetCookie();
}

/** Extracts the session cookie VALUE from a response, or null. */
export function sessionCookieValue(res: Response): string | null {
  for (const c of setCookies(res)) {
    const m = c.match(new RegExp(`^${COOKIE_NAME}=([^;]*)`));
    if (m && m[1]) return m[1];
  }
  return null;
}
