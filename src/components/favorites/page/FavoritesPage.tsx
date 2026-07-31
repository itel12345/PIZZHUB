"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useFavorites } from "../hooks/useFavorites";
import PizzaCard from "@/components/menu/PizzaCard/PizzaCard";
import type { Pizza } from "@/components/menu/hooks/useMenuFilters";

import styles from "./FavoritesPage.module.css";

export default function FavoritesPage() {
  const { favorites, favoriteCount } = useFavorites();

  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPizzas() {
      try {
        const response = await fetch("/api/pizzas");

        if (!response.ok) {
          throw new Error("Failed to load pizzas.");
        }

        const data = await response.json();

        setPizzas(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadPizzas();
  }, []);

  const favoritePizzas = useMemo(() => {
    return pizzas.filter((pizza) =>
      favorites.includes(pizza.id)
    );
  }, [pizzas, favorites]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>
            Your Favorites
          </span>

          <h1 className={styles.title}>
            Pizzas you love.
          </h1>

          <p className={styles.subtitle}>
            {favoriteCount > 0
              ? `${favoriteCount} pizza${
                  favoriteCount === 1 ? "" : "s"
                } saved for later.`
              : "Everything you save shows up here — tap the heart on any pizza to start."}
          </p>
        </header>

        {loading ? (
          <div className={styles.empty}>
            Loading...
          </div>
        ) : favoritePizzas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={styles.grid}>
            {favoritePizzas.map((pizza, index) => (
              <PizzaCard
                key={pizza.id}
                pizza={pizza}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.empty}>
      <svg
        viewBox="0 0 24 24"
        className={styles.emptyIcon}
        aria-hidden="true"
      >
        <path
          d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4 5.6 4c2 0 3.4 1 4.4 2.5C11 5 12.4 4 14.4 4 18 4 19.6 7.8 22 11.2c-2.5 4.7-10 9.3-10 9.3z"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinejoin="round"
        />
      </svg>

      <h2 className={styles.emptyTitle}>
        No favorites yet
      </h2>

      <p className={styles.emptyDescription}>
        Tap the heart on any pizza in the menu to save it here for next time.
      </p>

      <Link
        href="/menu"
        className={styles.emptyCta}
      >
        Browse Menu
      </Link>
    </div>
  );
}