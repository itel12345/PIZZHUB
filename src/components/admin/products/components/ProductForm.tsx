// src/components/admin/products/components/ProductForm.tsx
//
// Deliberately dumb: owns its own input state and client-side
// validation, but has no idea whether it's creating or editing a
// pizza — the parent page passes an `onSubmit` that decides that. This
// is what lets the exact same component get reused for Edit later
// without touching this file.
//
// Client-side validation runs the exact same Zod schema the server
// uses (src/lib/validation/product.ts), so the message a user sees
// here is guaranteed to match what the API would have said anyway —
// no duplicated, silently-drifting rules.

"use client";

import { useId, useState, type FormEvent } from "react";
import type { ProductFormValues } from "../types";
import { CATEGORY_OPTIONS } from "../types";
import { productInputSchema, flattenProductErrors } from "@/lib/validation/product";
import ImageUploadField from "./ImageUploadField";
import styles from "./ProductForm.module.css";

type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;

interface ProductFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitting: boolean;
  error?: string | null;
  serverFieldErrors?: FieldErrors;
}

const DEFAULTS: ProductFormValues = {
  name: "",
  description: "",
  price: 0,
  image: "",
  category: "Classic",
  rating: 4.5,
  ingredients: [],
  isPremium: false,
};

export default function ProductForm({
  mode,
  initialValues,
  onSubmit,
  submitting,
  error,
  serverFieldErrors,
}: ProductFormProps) {
  const formId = useId();

  const [name, setName] = useState(initialValues?.name ?? DEFAULTS.name);
  const [description, setDescription] = useState(
    initialValues?.description ?? DEFAULTS.description
  );
  const [price, setPrice] = useState(
    initialValues?.price !== undefined ? String(initialValues.price) : ""
  );
  const [image, setImage] = useState(initialValues?.image ?? DEFAULTS.image);
  const [category, setCategory] = useState<ProductFormValues["category"]>(
    initialValues?.category ?? DEFAULTS.category
  );
  const [rating, setRating] = useState(
    String(initialValues?.rating ?? DEFAULTS.rating)
  );
  const [ingredientsText, setIngredientsText] = useState(
    (initialValues?.ingredients ?? []).join(", ")
  );
  const [isPremium, setIsPremium] = useState(
    initialValues?.isPremium ?? DEFAULTS.isPremium
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Server errors take over once a submit attempt has round-tripped
  // (e.g. a race where two admins edit the same pizza); client errors
  // take over the instant the person edits a field again.
  const errors: FieldErrors = { ...serverFieldErrors, ...fieldErrors };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const candidate = {
      name,
      description,
      price: Number(price),
      image: image.trim(),
      category,
      rating: Number(rating),
      ingredients: ingredientsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      isPremium,
    };

    const result = productInputSchema.safeParse(candidate);

    if (!result.success) {
      setFieldErrors(flattenProductErrors(result.error));
      return;
    }

    setFieldErrors({});
    await onSubmit(result.data as ProductFormValues);
  };

  const clearFieldError = (field: keyof ProductFormValues) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const fieldId = (name: string) => `${formId}-${name}`;
  const errorId = (name: string) => `${formId}-${name}-error`;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor={fieldId("name")}>Name</label>
        <input
          id={fieldId("name")}
          type="text"
          value={name}
          maxLength={80}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? errorId("name") : undefined}
          onChange={(e) => {
            setName(e.target.value);
            clearFieldError("name");
          }}
          placeholder="e.g. Smoky BBQ Chicken"
        />
        {errors.name && (
          <p id={errorId("name")} className={styles.fieldError} role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={fieldId("description")}>Description</label>
        <textarea
          id={fieldId("description")}
          value={description}
          maxLength={500}
          required
          rows={3}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? errorId("description") : undefined}
          onChange={(e) => {
            setDescription(e.target.value);
            clearFieldError("description");
          }}
          placeholder="A short, appetizing description"
        />
        {errors.description && (
          <p id={errorId("description")} className={styles.fieldError} role="alert">
            {errors.description}
          </p>
        )}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={fieldId("price")}>Price (GHS)</label>
          <input
            id={fieldId("price")}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            required
            value={price}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={errors.price ? errorId("price") : undefined}
            onChange={(e) => {
              setPrice(e.target.value);
              clearFieldError("price");
            }}
            placeholder="e.g. 85"
          />
          {errors.price && (
            <p id={errorId("price")} className={styles.fieldError} role="alert">
              {errors.price}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={fieldId("rating")}>Rating (0–5)</label>
          <input
            id={fieldId("rating")}
            type="number"
            inputMode="decimal"
            min="0"
            max="5"
            step="0.1"
            required
            value={rating}
            aria-invalid={Boolean(errors.rating)}
            aria-describedby={errors.rating ? errorId("rating") : undefined}
            onChange={(e) => {
              setRating(e.target.value);
              clearFieldError("rating");
            }}
          />
          {errors.rating && (
            <p id={errorId("rating")} className={styles.fieldError} role="alert">
              {errors.rating}
            </p>
          )}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={fieldId("category")}>Category</label>
          <select
            id={fieldId("category")}
            value={category}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? errorId("category") : undefined}
            onChange={(e) => {
              setCategory(e.target.value as ProductFormValues["category"]);
              clearFieldError("category");
            }}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.category && (
            <p id={errorId("category")} className={styles.fieldError} role="alert">
              {errors.category}
            </p>
          )}
        </div>

        <div className={styles.fieldCheckbox}>
          <label htmlFor={fieldId("isPremium")}>
            <input
              id={fieldId("isPremium")}
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
            />
            Chef&apos;s Selection (premium)
          </label>
        </div>
      </div>

      <ImageUploadField
        value={image}
        disabled={submitting}
        error={errors.image}
        onChange={(url) => {
          setImage(url);
          clearFieldError("image");
        }}
      />

      <div className={styles.field}>
        <label htmlFor={fieldId("ingredients")}>Ingredients (comma-separated)</label>
        <input
          id={fieldId("ingredients")}
          type="text"
          value={ingredientsText}
          required
          aria-invalid={Boolean(errors.ingredients)}
          aria-describedby={errors.ingredients ? errorId("ingredients") : undefined}
          onChange={(e) => {
            setIngredientsText(e.target.value);
            clearFieldError("ingredients");
          }}
          placeholder="Mozzarella, Basil, Tomato Sauce"
        />
        {errors.ingredients && (
          <p id={errorId("ingredients")} className={styles.fieldError} role="alert">
            {errors.ingredients}
          </p>
        )}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button type="submit" className={styles.submitButton} disabled={submitting}>
        {submitting ? "Saving…" : mode === "create" ? "Add Pizza" : "Save Changes"}
      </button>
    </form>
  );
}
