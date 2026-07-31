import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pizzas = await prisma.pizza.findMany({
      orderBy: {
        addedAt: "desc",
      },
    });

    return NextResponse.json(
      pizzas.map((pizza) => ({
        id: `p-${String(pizza.id).padStart(2, "0")}`,
        dbId: pizza.id,
        name: pizza.name,
        description: pizza.description,
        ingredients: pizza.ingredients ?? [],
        category: pizza.category,
        price: pizza.price,
        rating: pizza.rating,
        image: pizza.image,
        isPremium: pizza.isPremium ?? false,
        addedAt: pizza.addedAt,
      }))
    );
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