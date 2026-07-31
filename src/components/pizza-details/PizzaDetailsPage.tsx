// src/components/pizza-details/PizzaDetailsPage.tsx
//
// Top-level composition for a single pizza's details page. Pure UI —
// reads the pizza (and the full pizza list, for RelatedPizzas) from
// props passed in by the route, which now sources both from Postgres
// via Prisma (see src/app/menu/[id]/page.tsx).

import type { Pizza } from "@/components/menu/hooks/useMenuFilters";
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
  pizzas: Pizza[];
}

export default function PizzaDetailsPage({ pizza, pizzas }: PizzaDetailsPageProps) {
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
            <PizzaActions
              pizzaId={pizza.id}
              pizzaName={pizza.name}
              pizzaImage={pizza.image}
              pizzaPrice={pizza.price}
            />
          </div>
        </div>

        <div className={styles.sections}>
          <IngredientsList ingredients={pizza.ingredients} />
          <ChefNotes />
          <Nutrition pizzaId={pizza.id} />
        </div>
      </div>

      <RelatedPizzas currentPizza={pizza} pizzas={pizzas} />
    </div>
  );
}