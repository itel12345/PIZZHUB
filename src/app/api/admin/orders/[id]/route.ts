// src/app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth";
import { getOrderForAdmin, updateOrderStatusByAdmin, OrderNotFoundError } from "@/lib/orders";
import { updateOrderStatusSchema } from "@/lib/validation/adminOrder";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const order = await getOrderForAdmin(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const result = updateOrderStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please choose a valid status.",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const order = await updateOrderStatusByAdmin(id, result.data.status);
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
