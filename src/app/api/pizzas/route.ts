import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPizzaDTO } from "@/lib/pizza";

export async function GET() {
  try {
    const pizzas = await prisma.pizza.findMany({
      orderBy: {
        addedAt: "desc",
      },
    });

    return NextResponse.json(pizzas.map(toPizzaDTO));
  } catch (error) {
    console.error("========== API ERROR ==========");
    console.error(error);
    console.error("===============================");

    return NextResponse.json(
      {
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}