"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "./FavoriteButton";
import { useFavorites } from "@/components/favorites";
import { useCart } from "@/components/cart";
import { useAuth } from "@/components/auth";
import styles from "./PizzaCard.module.css";
import type { Pizza } from "../hooks/useMenuFilters";

interface PizzaCardProps {
  pizza: Pizza;
  index: number;
}

export default function PizzaCard({ pizza, index }: PizzaCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAdd = async () => {
    if (!isAuthenticated) {
      alert("Please login first.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pizzaId: pizza.id,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to add pizza.");
        return;
      }

      // Keep the current UI working while we migrate
      addToCart(
        {
          pizzaId: pizza.id,
          name: pizza.name,
          image: pizza.image,
          price: pizza.price,
        },
        quantity
      );

      setAdded(true);

      window.setTimeout(() => {
        setAdded(false);
      }, 1600);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  };

  return (
    <article className={styles.card}>
      <Link
        href={`/menu/${pizza.id}`}
        className={styles.cardLink}
        aria-label={`View details for ${pizza.name}`}
      >
        <div className={styles.imageWrapper}>
          <Image
            src={pizza.image}
            alt={pizza.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={styles.image}
          />

          {pizza.isPremium && (
            <span className={styles.badge}>
              Chef&apos;s Selection
            </span>
          )}

          <FavoriteButton
            isFavorite={isFavorite(pizza.id)}
            onToggle={() => toggleFavorite(pizza.id)}
            pizzaName={pizza.name}
          />
        </div>

        <div className={styles.info}>
          <span className={styles.number}>
            No. {String(index + 1).padStart(2, "0")}
          </span>

          <h3 className={styles.name}>{pizza.name}</h3>

          <p className={styles.description}>
            {pizza.description}
          </p>

          <ul className={styles.ingredients}>
            {pizza.ingredients.map((ingredient, i) => (
              <li
                key={ingredient}
                className={styles.ingredient}
              >
                {ingredient}

                {i < pizza.ingredients.length - 1 && (
                  <span className={styles.dot}>
                    ·
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className={styles.meta}>
            <span className={styles.rating}>
              <svg
                viewBox="0 0 24 24"
                className={styles.star}
                aria-hidden="true"
              >
                <path
                  d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2z"
                  fill="currentColor"
                />
              </svg>

              {pizza.rating.toFixed(1)}
            </span>

            <span className={styles.price}>
              GHS {pizza.price}
            </span>
          </div>
        </div>
      </Link>

      <div className={styles.actionsWrapper}>
        <div className={styles.actions}>
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepperButton}
              onClick={() =>
                setQuantity((q) => Math.max(1, q - 1))
              }
            >
              −
            </button>

            <span
              className={styles.quantity}
              aria-live="polite"
            >
              {quantity}
            </span>

            <button
              type="button"
              className={styles.stepperButton}
              onClick={() =>
                setQuantity((q) => Math.min(9, q + 1))
              }
            >
              +
            </button>
          </div>

          <button
            type="button"
            className={`${styles.addButton} ${
              added ? styles.addButtonActive : ""
            }`}
            onClick={handleAdd}
          >
            {added ? "Added" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}