// src/components/pizza-details/PizzaDetailsPage.tsx
//
// Top-level composition for a single pizza's details page. Pure UI —
// reads the pizza from the static pizzas.ts data passed in by the route,
// no database/API/Prisma involved yet (see src/app/menu/[id]/page.tsx).

import type { Pizza } from "@/components/menu/data/pizzas";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PizzaGallery } from "./PizzaGallery";
import { PizzaInformation } from "./PizzaInformation";
import { PizzaActions } from "./PizzaActions";
import { IngredientsList } from "./IngredientsList";
import { ChefNotes } from "./ChefNotes";
import { Nutrition } from "./Nutrition";
import { RelatedPizzas } from "./RelatedPizzas";
import styles from "./PizzaDetailsPage.module.css";

interface PizzaDetailsPageProps {
  pizza: Pizza;
}

export default function PizzaDetailsPage({ pizza }: PizzaDetailsPageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Menu", href: "/menu" },
            { label: pizza.name },
          ]}
        />

        <div className={styles.hero}>
          <PizzaGallery image={pizza.image} name={pizza.name} />

          <div className={styles.heroInfo}>
            <PizzaInformation pizza={pizza} />
            <PizzaActions pizzaName={pizza.name} />
          </div>
        </div>

        <div className={styles.sections}>
          <IngredientsList ingredients={pizza.ingredients} />
          <ChefNotes />
          <Nutrition pizzaId={pizza.id} />
        </div>
      </div>

      <RelatedPizzas currentPizza={pizza} />
    </div>
  );
}