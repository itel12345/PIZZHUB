import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const token = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };

    const body = await request.json();

    const { pizzaId, quantity = 1 } = body;

    if (!pizzaId) {
      return NextResponse.json(
        { error: "Pizza ID is required." },
        { status: 400 }
      );
    }

    const pizza = await prisma.pizza.findUnique({
      where: {
        id: Number(pizzaId),
      },
    });

    if (!pizza) {
      return NextResponse.json(
        { error: "Pizza not found." },
        { status: 404 }
      );
    }

    let cart = await prisma.cart.findUnique({
      where: {
        userId: decoded.userId,
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: decoded.userId,
        },
      });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_pizzaId: {
          cartId: cart.id,
          pizzaId: Number(pizzaId),
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          pizzaId: Number(pizzaId),
          quantity,
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: {
        id: cart.id,
      },
      include: {
        items: {
          include: {
            pizza: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      cart: updatedCart,
    });
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