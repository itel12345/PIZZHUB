import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { MenuPage } from "@/components/menu";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Menu — PizzHub",
  description:
    "Browse fresh, wood-fired pizzas crafted daily and delivered across Ghana.",
};

export default async function Menu() {
  const pizzas = await prisma.pizza.findMany({
    orderBy: {
      addedAt: "desc",
    },
  });

  return (
    <>
      <Navbar />

      <main>
        <MenuPage pizzas={pizzas} />
      </main>

      <Footer />
    </>
  );
}