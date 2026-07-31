import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { prisma } from "@/lib/prisma";
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
    id: pizza.id.toString(),
  }));
}

export async function generateMetadata({
  params,
}: PizzaPageProps): Promise<Metadata> {
  const { id } = await params;

  const pizza = await prisma.pizza.findUnique({
    where: {
      id: Number(id),
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

  const pizza = await prisma.pizza.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!pizza) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main>
        <PizzaDetailsPage pizza={pizza} />
      </main>

      <Footer />
    </>
  );
}