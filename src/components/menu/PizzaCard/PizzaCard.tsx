"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "./FavoriteButton";
import { useFavorites } from "@/components/favorites";
import { useCart, useCartToast } from "@/components/cart";
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
  const { items, addToCart } = useCart();
  const { showAddedToast, showQuantityUpdatedToast } = useCartToast();

  const handleAdd = async () => {
    // CartContext.addToCart already handles both guest (localStorage)
    // and authenticated (server) modes internally — it decides which
    // one to use, not this component. The manual fetch that used to
    // live here, and the "please log in first" guard, both predated
    // that — they were the pre-migration version of this button
    // talking to the old cart API directly. Now that CartContext does
    // that itself, keeping this component's own fetch meant every
    // click double-submitted (both this fetch AND CartContext's
    // internal one hit /api/cart), and the login guard meant guests
    // couldn't add to cart at all despite the whole point of the
    // guest-cart/merge-on-login design being that they can.
    //
    // wasAlreadyInCart is read BEFORE calling addToCart — items only
    // reflects post-add state after the promise resolves and this
    // component re-renders, so capturing it now is what actually lets
    // the toast say "added" vs "quantity updated" correctly.
    const wasAlreadyInCart = items.some(
      (item) => item.pizzaId === String(pizza.dbId)
    );

    const succeeded = await addToCart(
      {
        pizzaId: String(pizza.dbId),
        name: pizza.name,
        image: pizza.image,
        price: pizza.price,
      },
      quantity
    );

    // Toast only fires on a real, confirmed success — CartContext's
    // addToCart resolves false (and sets its own `error` state) on any
    // server-mode failure, so a rejected/failed add-to-cart request
    // never shows a false "added" confirmation.
    if (succeeded) {
      if (wasAlreadyInCart) {
        showQuantityUpdatedToast(pizza.name);
      } else {
        showAddedToast(pizza.name);
      }

      setAdded(true);
      window.setTimeout(() => {
        setAdded(false);
      }, 1600);
    }
  };

  return (
    <article className={styles.card}>
      {/* FavoriteButton renders as a sibling of Link, not a descendant
          — .card (not .imageWrapper) is now its positioned ancestor
          (see PizzaCard.module.css: .card got position: relative for
          exactly this). This is a structural fix, not just an event-
          handling one: no click on this button can ever reach Link's
          navigation, on any device or input type, because it's not
          inside the <a> the Link renders at all. Visually identical
          placement (top-right over the image) since nothing renders
          above the image within .card. */}
      <FavoriteButton
        isFavorite={isFavorite(String(pizza.dbId))}
        onToggle={() => toggleFavorite(String(pizza.dbId))}
        pizzaName={pizza.name}
      />

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