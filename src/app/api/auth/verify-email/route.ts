import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validation/auth";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { consumeRateLimit, getClientIp, tooManyRequests, LIMITS } from "@/lib/rate-limit";

// POST (not GET) so an email scanner or link-preview bot that merely
// fetches the emailed URL cannot spend the single-use token.
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
    const parsed = verifyEmailSchema.safeParse(body);
    const invalid = {
      error: "This verification link is invalid or has expired.",
      code: "INVALID_TOKEN",
    };
    if (!parsed.success) return NextResponse.json(invalid, { status: 400 });

    const userId = await consumeAuthToken(parsed.data.token, "EMAIL_VERIFICATION");
    if (!userId) return NextResponse.json(invalid, { status: 400 });

    await prisma.user.updateMany({
      where: { id: userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Email verified." }, { status: 200 });
  } catch (error) {
    console.error("verify-email failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
