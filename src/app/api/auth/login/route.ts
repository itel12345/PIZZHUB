import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { isTrustedAvatarUrl } from "@/lib/avatar-url";
import { loginSchema, normalizeEmail } from "@/lib/validation/auth";
import {
  createSession,
  setSessionCookie,
  clearSessionCookies,
  pruneExpiredAuthRows,
} from "@/lib/session";
import {
  consumeRateLimit,
  resetRateLimit,
  getClientIp,
  tooManyRequests,
  LIMITS,
} from "@/lib/rate-limit";

// A real bcrypt hash of a throwaway string, computed once. When the email
// doesn't exist we still run a full bcrypt comparison against it, so a
// "no such account" answer takes as long as a "wrong password" one and
// response time can't be used to discover which emails are registered.
let dummyHash: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  dummyHash ??= bcrypt.hash("pizzhub-timing-equaliser", 12);
  return dummyHash;
}

const DELETED_ACCOUNT_DOMAIN = "@deleted.invalid";

// The email-verification switch. OFF by default: existing customers have
// never verified an address, so turning this on before real email
// delivery is configured and tested would lock them all out. Flip it only
// as part of the approved rollout plan.
function verificationRequired(): boolean {
  return process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true";
}

const INVALID = { error: "Invalid email or password." };

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter your email and password." },
        { status: 400 }
      );
    }
    const email = normalizeEmail(parsed.data.email);
    const { password } = parsed.data;

    // Abuse protection BEFORE any bcrypt work (bcrypt is the expensive part).
    const ip = getClientIp(request.headers);
    const byIp = await consumeRateLimit("login:ip", ip, LIMITS.loginPerIp);
    const byEmail = await consumeRateLimit("login:email", email, LIMITS.loginPerEmail);
    if (!byIp.allowed || !byEmail.allowed) {
      const t = tooManyRequests(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds));
      return NextResponse.json(t.body, { status: t.status, headers: t.headers });
    }

    // Case-insensitive on purpose: older rows may not be lower-cased.
    // take: 2 so an ambiguous duplicate pair can be detected and refused.
    const matches = await prisma.user.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      take: 2,
    });
    const user =
      matches.length === 1 && !matches[0].email.endsWith(DELETED_ACCOUNT_DOMAIN)
        ? matches[0]
        : null;
    if (matches.length > 1) {
      // Fail closed rather than guess whose account this is. The email
      // itself is deliberately not logged.
      console.error("auth: duplicate case-insensitive email rows; login refused");
    }

    if (!user) {
      await bcrypt.compare(password, await getDummyHash());
      return NextResponse.json(INVALID, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return NextResponse.json(INVALID, { status: 401 });
    }

    // Only AFTER the password is proven, so this message can't be used to
    // learn whether an arbitrary address has an account.
    if (verificationRequired() && !user.emailVerifiedAt) {
      return NextResponse.json(
        {
          error: "Please verify your email address before signing in.",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 }
      );
    }

    await resetRateLimit("login:email", email);

    const { token, expiresAt } = await createSession(user.id, {
      userAgent: request.headers.get("user-agent"),
    });

    const role = user.role === "ADMIN" ? "ADMIN" : "USER";
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful!",
        // No token in the body: the credential lives only in the
        // HttpOnly cookie, out of reach of page scripts.
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
          avatarUrl: isTrustedAvatarUrl(user.image) ? user.image : undefined,
        },
      },
      { status: 200 }
    );
    clearSessionCookies(response); // expire any stale legacy admin cookie
    setSessionCookie(response, token, expiresAt);

    // Cheap housekeeping on ~1% of logins; never fails the login.
    if (Math.random() < 0.01) void pruneExpiredAuthRows().catch(() => {});

    return response;
  } catch (error) {
    console.error("login failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
