import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { pizzas } from "@/components/menu/data/pizzas";
import { PizzaDetailsPage } from "@/components/pizza-details";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

interface PizzaPageProps {
  params: Promise<{ id: string }>;
}

// Pre-render a page for every pizza in the static dataset at build time.
// Safe to keep once this becomes database-backed — swap the source array
// for a Prisma query and this still works the same way.
export function generateStaticParams() {
  return pizzas.map((pizza) => ({ id: pizza.id }));
}

export async function generateMetadata({ params }: PizzaPageProps): Promise<Metadata> {
  const { id } = await params;
  const pizza = pizzas.find((p) => p.id === id);

  return {
    title: pizza ? `${pizza.name} — PizzHub` : "Pizza Not Found — PizzHub",
  };
}

export default async function PizzaPage({ params }: PizzaPageProps) {
  const { id } = await params;
  const pizza = pizzas.find((p) => p.id === id);

  return (
    <>
      <Navbar />
      <main>
        {pizza ? (
          <PizzaDetailsPage pizza={pizza} />
        ) : (
          <PlaceholderPage
            eyebrow="404"
            title="This pizza isn't on the menu."
            description="It may have been taken off rotation, or the link might be outdated. Head back and keep browsing."
          />
        )}
      </main>
      <Footer />
    </>
  );
}