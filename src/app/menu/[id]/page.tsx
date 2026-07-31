import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { prisma } from "@/lib/prisma";
import { formatPizzaId, parsePizzaId, toPizzaDTO } from "@/lib/pizza";
import { PizzaDetailsPage } from "@/components/pizza-details";

interface PizzaPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const pizzas = await prisma.pizza.findMany({
    select: {
      id: true,
    },
  });

  return pizzas.map((pizza) => ({
    id: formatPizzaId(pizza.id),
  }));
}

export async function generateMetadata({
  params,
}: PizzaPageProps): Promise<Metadata> {
  const { id } = await params;
  const dbId = parsePizzaId(id);

  const pizza =
    dbId === null
      ? null
      : await prisma.pizza.findUnique({
          where: {
            id: dbId,
          },
        });

  return {
    title: pizza
      ? `${pizza.name} — PizzHub`
      : "Pizza Not Found — PizzHub",
  };
}

export default async function PizzaPage({
  params,
}: PizzaPageProps) {
  const { id } = await params;
  const dbId = parsePizzaId(id);

  if (dbId === null) {
    notFound();
  }

  const [pizza, allPizzas] = await Promise.all([
    prisma.pizza.findUnique({
      where: {
        id: dbId,
      },
    }),
    prisma.pizza.findMany({
      orderBy: {
        addedAt: "desc",
      },
    }),
  ]);

  if (!pizza) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main>
        <PizzaDetailsPage
          pizza={toPizzaDTO(pizza)}
          pizzas={allPizzas.map(toPizzaDTO)}
        />
      </main>

      <Footer />
    </>
  );
}