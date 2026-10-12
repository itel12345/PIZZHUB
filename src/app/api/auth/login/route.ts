import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/env";
import { ADMIN_SESSION_COOKIE, issueUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Please enter your email and password.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    // authVersion is baked in here (via issueUserToken, shared with
    // lib/account.ts's post-password-change re-issue) so requireUser()
    // (src/lib/auth.ts) can detect, on every later request, whether
    // something has since invalidated this specific session — see
    // that file for the full explanation. Read fresh from the row
    // fetched just above, not assumed to be 0.
    const token = issueUserToken(user);

    // Still needed directly (not via issueUserToken) for the separate
    // admin-cookie token below, which has a different payload shape
    // and TTL entirely.
    const jwtSecret = getJwtSecret();

    // `role` on User: if your Prisma client was generated before the
    // migration that added it, this cast is still safe (falls back to
    // "USER"), but you'll want `npx prisma generate` afterward so the
    // rest of the codebase gets real type-checking on `user.role`
    // instead of this explicit narrow cast.
    const role = (user as { role?: string }).role;
    const isAdmin = role === "ADMIN";

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful!",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: role ?? "USER",
        },
      },
      {
        status: 200,
      }
    );

    if (isAdmin) {
      const adminToken = jwt.sign(
        { userId: user.id, email: user.email, role: "ADMIN" },
        jwtSecret,
        { expiresIn: "8h" } // short TTL for the privileged session
      );

      response.cookies.set(ADMIN_SESSION_COOKIE, adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 hours, matches the token's expiry
      });
    }

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}