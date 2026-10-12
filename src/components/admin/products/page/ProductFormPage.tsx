// src/components/admin/products/page/ProductFormPage.tsx
//
// handleSubmit now catches its own errors. createPizza/updatePizza
// already store the failure message in `error` (from useAdminProducts)
// and ProductForm already renders it inline — this fix just stops that
// same error from ALSO escaping as an unhandled promise rejection,
// which is what was tripping Next's dev-mode crash overlay for what
// should have been an ordinary "fix this field" validation message.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminProducts } from "../hooks/useAdminProducts";
import ProductForm from "../components/ProductForm";
import type { ProductFormValues } from "../types";
import type { Pizza } from "@/lib/pizza";
import styles from "./ProductFormPage.module.css";

interface ProductFormPageProps {
  mode: "create" | "edit";
  /** Required when mode is "edit" — the pizza being edited. */
  pizza?: Pizza;
}

export default function ProductFormPage({ mode, pizza }: ProductFormPageProps) {
  const router = useRouter();
  const { createPizza, updatePizza, submitting, error, fieldErrors } =
    useAdminProducts();

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      if (mode === "edit" && pizza) {
        await updatePizza(pizza.id, values);
      } else {
        await createPizza(values);
      }

      // router.push alone can land on a client-cached RSC payload for
      // /admin/products rather than a fresh server render — the exact
      // same staleness risk the delete flow already guards against
      // with router.refresh() in ProductsTable. Same fix here: force
      // the target route to actually re-fetch from Postgres instead of
      // trusting whatever the router cache happens to be holding.
      router.refresh();
      router.push("/admin/products");
    } catch {
      // Already captured in `error` above and shown inline by
      // ProductForm — nothing further to do here. Swallowing this is
      // deliberate: without it, the exact same message escapes as an
      // unhandled rejection instead of the calm inline text.
    }
  };

  const initialValues: Partial<ProductFormValues> | undefined = pizza
    ? {
        name: pizza.name,
        description: pizza.description,
        price: pizza.price,
        image: pizza.image,
        category: pizza.category,
        rating: pizza.rating,
        ingredients: pizza.ingredients,
        isPremium: pizza.isPremium ?? false,
      }
    : undefined;

  return (
    <div className={styles.page}>
      <Link href="/admin/products" className={styles.backLink}>
        ← Back to Products
      </Link>

      <h1 className={styles.title}>
        {mode === "create" ? "Add Pizza" : `Edit ${pizza?.name ?? "Pizza"}`}
      </h1>

      <ProductForm
        mode={mode}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        serverFieldErrors={fieldErrors}
      />
    </div>
  );
}