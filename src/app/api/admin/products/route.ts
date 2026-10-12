// src/app/api/admin/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPizzaDTO } from "@/lib/pizza";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth";
import { productInputSchema, flattenProductErrors } from "@/lib/validation/product";
import { isOwnCloudinaryUrl } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const result = productInputSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: flattenProductErrors(result.error),
        },
        { status: 400 }
      );
    }

    const { name, description, price, image, category, rating, ingredients, isPremium } =
      result.data;

    // There's no legacy value to grandfather in on create — every new
    // product's image must have gone through our own signed upload
    // pipeline, not an arbitrary client-supplied URL.
    if (!isOwnCloudinaryUrl(image)) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: { image: "Upload an image using the image field above." },
        },
        { status: 400 }
      );
    }

    const pizza = await prisma.pizza.create({
      data: {
        name,
        description,
        price,
        image,
        category,
        rating,
        ingredients,
        isPremium,
        // addedAt is a Postgres `Int` (max ~2.1 billion) — Date.now()
        // returns milliseconds (13 digits, ~1.78 trillion right now),
        // which overflows it. Epoch SECONDS (10 digits, ~1.78 billion)
        // fits comfortably and still sorts correctly as "newest first".
        addedAt: Math.floor(Date.now() / 1000),
      },
    });

    return NextResponse.json(toPizzaDTO(pizza), { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
