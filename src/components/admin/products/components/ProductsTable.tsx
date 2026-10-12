// src/components/admin/products/components/ProductsTable.tsx
//
// Now a client component (needed for delete state + the confirm
// dialog). After a successful delete, router.refresh() re-runs the
// server component at /admin/products/page.tsx, which re-fetches from
// Postgres — so the table never holds its own "source of truth" copy
// of the list, it just re-renders with what the server just fetched.

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Pizza } from "@/lib/pizza";
import { useAdminProducts } from "../hooks/useAdminProducts";
import DeleteProductDialog from "./DeleteProductDialog";
import styles from "./ProductsTable.module.css";

interface ProductsTableProps {
  pizzas: Pizza[];
}

export default function ProductsTable({ pizzas }: ProductsTableProps) {
  const router = useRouter();
  const { deletePizza, deleting, deleteError } = useAdminProducts();
  const [pizzaToDelete, setPizzaToDelete] = useState<Pizza | null>(null);

  const handleConfirmDelete = async () => {
    if (!pizzaToDelete) return;

    try {
      await deletePizza(pizzaToDelete.id);
      setPizzaToDelete(null);
      router.refresh();
    } catch {
      // deleteError is already set by the hook; dialog stays open so
      // the admin can see why (e.g. the FK-conflict message) and decide.
    }
  };

  if (pizzas.length === 0) {
    return <p className={styles.empty}>No pizzas found in the database.</p>;
  }

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Pizza</th>
              <th scope="col">Category</th>
              <th scope="col">Price</th>
              <th scope="col">Rating</th>
              <th scope="col">Premium</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {pizzas.map((pizza) => (
              <tr key={pizza.id}>
                <td className={styles.idCell} data-label="ID">
                  {pizza.dbId}
                </td>

                <td className={styles.pizzaTd}>
                  <div className={styles.pizzaCell}>
                    <div className={styles.thumbnailWrapper}>
                      <Image
                        src={pizza.image}
                        alt={pizza.name}
                        fill
                        sizes="40px"
                        className={styles.thumbnail}
                      />
                    </div>
                    <span className={styles.pizzaName}>{pizza.name}</span>
                  </div>
                </td>

                <td data-label="Category">{pizza.category}</td>
                <td data-label="Price">GHS {pizza.price}</td>
                <td data-label="Rating">{pizza.rating.toFixed(1)}</td>
                <td data-label="Premium">
                  {pizza.isPremium ? (
                    <span className={styles.badge}>Premium</span>
                  ) : (
                    <span className={styles.badgeMuted}>Standard</span>
                  )}
                </td>

                <td className={styles.actionsTd}>
                  <div className={styles.actions}>
                    <Link
                      href={`/admin/products/${pizza.id}`}
                      className={styles.editLink}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => setPizzaToDelete(pizza)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteProductDialog
        pizza={pizzaToDelete}
        deleting={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => setPizzaToDelete(null)}
      />
    </>
  );
}