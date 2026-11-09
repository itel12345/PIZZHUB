// src/lib/authConstants.ts
//
// Deliberately has NO imports, so any runtime (Node, the proxy, tests)
// can load it without pulling in Prisma.

/**
 * The one session cookie for customers AND admins. Its value is a random
 * secret; the database stores only the SHA-256 hash of it (see
 * lib/session.ts). In production the `__Host-` prefix makes browsers
 * refuse it unless it is Secure, Path=/ and has no Domain attribute,
 * which blocks cookie-tossing from sibling subdomains. In development
 * (plain http://localhost) a `__Host-` cookie would be rejected, so the
 * prefix is dropped there.
 */
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-pizzhub_session"
    : "pizzhub_session";

/**
 * LEGACY. The old 8-hour admin JWT cookie. Nothing reads it any more;
 * the constant exists only so login/logout/delete-account can actively
 * expire a stale copy in browsers that still hold one, and so existing
 * `import { ADMIN_SESSION_COOKIE } from "@/lib/auth"` lines keep working.
 */
export const ADMIN_SESSION_COOKIE = "admin_session";
