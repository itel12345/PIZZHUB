// src/components/admin/products/hooks/useAdminProducts.ts
//
// createPizza/updatePizza share one submitting/error pair (only one
// form is ever active at a time). deletePizza gets its own — it's
// triggered from a dialog over the table, entirely separate from
// whatever the create/edit form might be doing.
//
// fieldErrors surfaces the server's per-field Zod messages (see
// src/lib/validation/product.ts) so the form can point at exactly
// which input is wrong, not just show one generic sentence.

"use client";

import { useState, useCallback } from "react";
import type { ProductFormValues } from "../types";
import type { Pizza } from "@/lib/pizza";

interface ApiErrorBody {
  error?: string;
  fieldErrors?: Partial<Record<keyof ProductFormValues, string>>;
}

export function useAdminProducts() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ProductFormValues, string>>
  >({});

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const submit = useCallback(
    async (url: string, method: "POST" | "PATCH", values: ProductFormValues): Promise<Pizza> => {
      setSubmitting(true);
      setError(null);
      setFieldErrors({});

      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const data = (await response.json()) as Pizza & ApiErrorBody;

        if (!response.ok) {
          if (data.fieldErrors) setFieldErrors(data.fieldErrors);
          throw new Error(data.error || "Something went wrong.");
        }

        return data as Pizza;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const createPizza = useCallback(
    (values: ProductFormValues) => submit("/api/admin/products", "POST", values),
    [submit]
  );

  const updatePizza = useCallback(
    (id: string, values: ProductFormValues) =>
      submit(`/api/admin/products/${id}`, "PATCH", values),
    [submit]
  );

  const deletePizza = useCallback(async (id: string): Promise<void> => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete pizza.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setDeleteError(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    createPizza,
    updatePizza,
    submitting,
    error,
    fieldErrors,
    deletePizza,
    deleting,
    deleteError,
  };
}
