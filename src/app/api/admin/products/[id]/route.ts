// src/app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { parsePizzaId, toPizzaDTO } from "@/lib/pizza";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth";
import { productInputSchema, flattenProductErrors } from "@/lib/validation/product";
import { isOwnCloudinaryUrl, extractPublicId, deleteCloudinaryAsset } from "@/lib/cloudinary";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const dbId = parsePizzaId(id);

    if (dbId === null) {
      return NextResponse.json(
        { error: "Invalid pizza id." },
        { status: 400 }
      );
    }

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

    const existing = await prisma.pizza.findUnique({ where: { id: dbId } });

    if (!existing) {
      return NextResponse.json(
        { error: "Pizza not found." },
        { status: 404 }
      );
    }

    // Grandfather in the existing image if it's untouched (older rows
    // may predate the Cloudinary upload pipeline and point at other
    // hosts) — but any *new* value must have gone through our signed
    // upload flow. This is what stops someone from bypassing
    // ImageUploadField entirely and PATCHing an arbitrary external URL
    // straight into the API.
    if (image !== existing.image && !isOwnCloudinaryUrl(image)) {
      return NextResponse.json(
        {
          error: "Please fix the highlighted fields.",
          fieldErrors: { image: "Upload an image using the image field above." },
        },
        { status: 400 }
      );
    }

    const pizza = await prisma.pizza.update({
      where: { id: dbId },
      data: {
        name,
        description,
        price,
        image,
        category,
        rating,
        ingredients,
        isPremium,
        // addedAt is intentionally left untouched — editing a pizza
        // shouldn't bump it to the top of "newest" sorting.
      },
    });

    return NextResponse.json(toPizzaDTO(pizza), { status: 200 });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const dbId = parsePizzaId(id);

    if (dbId === null) {
      return NextResponse.json(
        { error: "Invalid pizza id." },
        { status: 400 }
      );
    }

    // Read the row before deleting it — need its image URL to clean up
    // the matching Cloudinary asset. If it's already gone, the delete
    // below hits the P2025 branch same as before.
    const existing = await prisma.pizza.findUnique({ where: { id: dbId } });

    await prisma.pizza.delete({ where: { id: dbId } });

    // Best-effort: an admin's delete of a *product* succeeding is the
    // thing that matters here. Cleanup of the underlying image asset
    // in a third-party service is important (avoids paying to store
    // orphaned files forever) but must never be allowed to turn a
    // successful product deletion into a user-facing error.
    if (existing?.image) {
      const publicId = extractPublicId(existing.image);
      if (publicId) {
        void deleteCloudinaryAsset(publicId).catch(() => {});
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    // P2025: record to delete doesn't exist (already deleted, or bad id).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Pizza not found." },
        { status: 404 }
      );
    }

    // P2003: foreign key constraint failed — this pizza is referenced by
    // a CartItem (schema has no cascade on that relation), so Postgres
    // refuses the delete rather than silently orphaning cart rows.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "This pizza can't be deleted because it's currently in one or more customer carts.",
        },
        { status: 409 }
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
