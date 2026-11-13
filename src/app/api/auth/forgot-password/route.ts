import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailOnlySchema } from "@/lib/validation/auth";
import { createAuthToken } from "@/lib/auth-tokens";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { consumeRateLimit, getClientIp, tooManyRequests, LIMITS } from "@/lib/rate-limit";

const DELETED_ACCOUNT_DOMAIN = "@deleted.invalid";

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

    const byIp = await consumeRateLimit("forgot:ip", getClientIp(request.headers), LIMITS.forgotPerIp);
    const byEmail = await consumeRateLimit("forgot:email", email, LIMITS.forgotPerEmail);
    if (!byIp.allowed || !byEmail.allowed) {
      const t = tooManyRequests(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds));
      return NextResponse.json(t.body, { status: t.status, headers: t.headers });
    }

    // The previous UI said "a reset link is on its way" while sending
    // nothing. Until a real provider is configured we say so instead.
    // This depends only on server configuration, never on the address,
    // so it reveals nothing about which accounts exist.
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Password reset by email isn't available yet. Please contact the store." },
        { status: 503 }
      );
    }

    const matches = await prisma.user.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, name: true, email: true },
      take: 2,
    });
    const user =
      matches.length === 1 && !matches[0].email.endsWith(DELETED_ACCOUNT_DOMAIN) ? matches[0] : null;

    // Sent INLINE, before answering, so a "sent" page is never shown for
    // an email that was not handed to the provider. (Deferring it with
    // after() would hide the tiny timing difference between known and
    // unknown addresses, but on serverless hosts background work can be
    // cut off after the response, which would silently drop real reset
    // emails. Account existence is already revealed by signup's 409, and
    // this endpoint is rate-limited per IP and per email.)
    if (user) {
      try {
        const token = await createAuthToken(user.id, "PASSWORD_RESET");
        await sendPasswordResetEmail(user.email, user.name, token);
      } catch (error) {
        // Never surfaced to the caller (same generic 200 either way).
        console.error("password reset email failed:", error instanceof Error ? error.name : "unknown");
      }
    }

    return NextResponse.json(
      { success: true, message: "If an account exists for that email, a reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("forgot-password failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
