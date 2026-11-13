import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailOnlySchema } from "@/lib/validation/auth";
import { createAuthToken } from "@/lib/auth-tokens";
import { isEmailConfigured, sendVerificationEmail } from "@/lib/email";
import { consumeRateLimit, getClientIp, tooManyRequests, LIMITS } from "@/lib/rate-limit";

// Public on purpose: when verification is required, the people who need
// this are exactly those who cannot sign in. The answer is identical
// whether or not the address has an account.
const GENERIC = {
  success: true,
  message: "If that address has an unverified account, a new verification email is on its way.",
};

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const parsed = emailOnlySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const { email } = parsed.data;

    const byIp = await consumeRateLimit("resend:ip", getClientIp(request.headers), LIMITS.resendPerIp);
    const byEmail = await consumeRateLimit("resend:email", email, LIMITS.resendPerEmail);
    if (!byIp.allowed || !byEmail.allowed) {
      const t = tooManyRequests(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds));
      return NextResponse.json(t.body, { status: t.status, headers: t.headers });
    }

    // Truthful: do not say "on its way" when nothing can be sent.
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Verification email isn't available yet. Please contact the store." },
        { status: 503 }
      );
    }

    const matches = await prisma.user.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, name: true, email: true, emailVerifiedAt: true },
      take: 2,
    });
    const user = matches.length === 1 ? matches[0] : null;

    // Sent inline for reliability on serverless hosts (see forgot-password).
    if (user && !user.emailVerifiedAt) {
      try {
        const token = await createAuthToken(user.id, "EMAIL_VERIFICATION");
        await sendVerificationEmail(user.email, user.name, token);
      } catch (error) {
        console.error("resend verification failed:", error instanceof Error ? error.name : "unknown");
      }
    }
    return NextResponse.json(GENERIC, { status: 200 });
  } catch (error) {
    console.error("resend-verification failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
