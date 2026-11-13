import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { revokeAllSessionsForUser } from "@/lib/session";
import { consumeRateLimit, getClientIp, tooManyRequests, LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = await consumeRateLimit("token:ip", getClientIp(request.headers), LIMITS.tokenActionPerIp);
    if (!limit.allowed) {
      const t = tooManyRequests(limit.retryAfterSeconds);
      return NextResponse.json(t.body, { status: t.status, headers: t.headers });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Validate the new password BEFORE spending the single-use token, so
    // a too-short password doesn't burn the person's only reset link.
    const INVALID_LINK = {
      error: "This reset link is invalid or has expired.",
      code: "INVALID_TOKEN",
    };
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      // A malformed/tampered token is reported exactly like an expired
      // one; only password-rule problems get their own message.
      const tokenIssue = parsed.error.issues.some((i) => i.path[0] === "token");
      if (tokenIssue) return NextResponse.json(INVALID_LINK, { status: 400 });
      const first = parsed.error.issues[0]?.message;
      return NextResponse.json(
        { error: first ?? "Invalid request.", code: "INVALID_PASSWORD" },
        { status: 400 }
      );
    }

    const userId = await consumeAuthToken(parsed.data.token, "PASSWORD_RESET");
    if (!userId) return NextResponse.json(INVALID_LINK, { status: 400 });

    const hashed = await hashPassword(parsed.data.password);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, authVersion: { increment: 1 } },
    });
    // Opening the emailed link proves control of the mailbox.
    await prisma.user.updateMany({
      where: { id: userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });

    // Anyone who had the old password (including an attacker) is signed
    // out everywhere. The person signs in again with the new password.
    await revokeAllSessionsForUser(userId);
    // Other outstanding reset links are now meaningless.
    await prisma.authToken.deleteMany({ where: { userId, type: "PASSWORD_RESET", usedAt: null } });

    return NextResponse.json(
      { success: true, message: "Password updated. Please sign in with your new password." },
      { status: 200 }
    );
  } catch (error) {
    console.error("reset-password failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
