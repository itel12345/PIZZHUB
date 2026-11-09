import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validation/auth";
import { createAuthToken } from "@/lib/auth-tokens";
import { isEmailConfigured, sendVerificationEmail } from "@/lib/email";
import {
  consumeRateLimit,
  getClientIp,
  tooManyRequests,
  LIMITS,
} from "@/lib/rate-limit";

const EXISTS = {
  error: "An account with this email already exists.",
};

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      return NextResponse.json(
        { error: first ?? "Please fill in all required fields." },
        { status: 400 }
      );
    }
    const { name, email, password } = parsed.data;

    const limit = await consumeRateLimit(
      "signup:ip",
      getClientIp(request.headers),
      LIMITS.signupPerIp
    );
    if (!limit.allowed) {
      const t = tooManyRequests(limit.retryAfterSeconds);
      return NextResponse.json(t.body, { status: t.status, headers: t.headers });
    }

    // Case-insensitive, so Ama@x.com can't register beside ama@x.com.
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      // KNOWN LIMITATION: this answer reveals that an address is
      // registered. It is rate-limited per IP above, and is kept for now
      // because the signup form needs it until verification email is
      // live; the anti-enumeration alternative (identical response for
      // new and existing addresses, plus a notice email) requires the
      // email system and is planned with it.
      return NextResponse.json(EXISTS, { status: 409 });
    }

    const hashed = await hashPassword(password);

    let user;
    try {
      user = await prisma.user.create({
        data: { name, email, password: hashed, cart: { create: {} } },
        select: { id: true, name: true, email: true },
      });
    } catch (error) {
      // Two signups racing for the same address: the unique index wins.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json(EXISTS, { status: 409 });
      }
      throw error;
    }

    // Send the verification email only if a real provider is configured,
    // and report what ACTUALLY happened. (Sent inline rather than after
    // the response: signup already reveals whether an address exists, so
    // there is no timing privacy to protect, and the message below must
    // not claim an email was sent when the provider call failed.)
    let verificationEmailSent = false;
    if (isEmailConfigured()) {
      try {
        const token = await createAuthToken(user.id, "EMAIL_VERIFICATION");
        await sendVerificationEmail(user.email, user.name, token);
        verificationEmailSent = true;
      } catch (error) {
        console.error("verification email failed:", error instanceof Error ? error.name : "unknown");
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: verificationEmailSent
          ? "Account created! Check your email for a link to verify your address."
          : "Account created successfully!",
        verificationEmailSent,
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("signup failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
