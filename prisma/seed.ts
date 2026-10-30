
import "dotenv/config";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from the environment.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const existingPizzaCount = await prisma.pizza.count();

  if (existingPizzaCount > 0) {
    console.log(
      `Seed skipped: ${existingPizzaCount} pizza records already exist. No data was changed.`,
    );
    return;
  }

  await prisma.pizza.createMany({
    data: [
      {
        name: "Margherita Classica",
        description:
          "San Marzano tomato, fior di latte, basil, cold-pressed olive oil.",
        price: 85,
        image: "/img/img_1-removebg-preview.png",
        category: "Classic",
        ingredients: ["Tomato", "Mozzarella", "Basil"],
        isPremium: false,
        rating: 4.8,
        addedAt: 1,
      },
      {
        name: "Wood-Fired Pepperoni",
        description:
          "Double-cured pepperoni, house tomato base, aged mozzarella.",
        price: 95,
        image: "/img/menu/pepperoni.jpg",
        category: "Classic",
        ingredients: ["Pepperoni", "Mozzarella", "Oregano"],
        isPremium: false,
        rating: 4.7,
        addedAt: 2,
      },
      {
        name: "Truffle & Wild Mushroom",
        description:
          "Black truffle cream, roasted mushrooms, taleggio.",
        price: 145,
        image: "/img/menu/truffle-mushroom.jpg",
        category: "Signature",
        ingredients: ["Truffle Cream", "Mushroom", "Taleggio"],
        isPremium: true,
        rating: 4.9,
        addedAt: 3,
      },
      {
        name: "Suya-Spiced Beef",
        description:
          "House-ground beef, suya spice, onion.",
        price: 110,
        image: "/img/menu/suya-beef.jpg",
        category: "Spicy",
        ingredients: ["Beef", "Suya Spice", "Onion"],
        isPremium: true,
        rating: 4.8,
        addedAt: 4,
      },
      {
        name: "Diavola",
        description:
          "Spicy salami, chili, mozzarella.",
        price: 100,
        image: "/img/menu/diavola.jpg",
        category: "Spicy",
        ingredients: ["Salami", "Chili", "Mozzarella"],
        isPremium: false,
        rating: 4.6,
        addedAt: 5,
      },
    ],
  });

  console.log("Pizza database seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Pizza database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
