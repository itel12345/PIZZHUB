import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parsePizzaId, toPizzaDTO } from "@/lib/pizza";
import { ProductFormPage } from "@/components/admin/products";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

// React's request-scoped memoization: generateMetadata and the page
// both need "the pizza for this id", and previously each ran its own
// prisma.pizza.findUnique() — two round trips for one request. Wrapping
// the fetch in cache() means the second call within the same render
// reuses the first call's result instead of re-querying.
const getPizza = cache(async (dbId: number) => {
  return prisma.pizza.findUnique({ where: { id: dbId } });
});

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const dbId = parsePizzaId(id);

  const pizza = dbId === null ? null : await getPizza(dbId);

  return {
    title: pizza
      ? `Edit ${pizza.name} — PizzHub Admin`
      : "Pizza Not Found — PizzHub Admin",
  };
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const dbId = parsePizzaId(id);

  if (dbId === null) {
    notFound();
  }

  const pizza = await getPizza(dbId);

  if (!pizza) {
    notFound();
  }

  return <ProductFormPage mode="edit" pizza={toPizzaDTO(pizza)} />;
}
