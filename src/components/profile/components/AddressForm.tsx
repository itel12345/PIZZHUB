// src/components/profile/components/AddressForm.tsx
//
// "Dumb" form component: owns only its own input state and calls
// onSubmit with a plain object — same division of responsibility as
// admin's ProductForm.tsx (form owns fields, parent owns the actual
// fetch/submitting/error state). Used for both Add and Edit — Edit
// just passes `initialValue`.

"use client";

import { useState, type FormEvent } from "react";
import type { Address } from "@/components/addresses";
import styles from "./AddressForm.module.css";

export interface AddressFormValues {
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  deliveryInstructions: string;
}

interface AddressFormProps {
  initialValue?: Address;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: AddressFormValues) => void;
  onCancel: () => void;
}

const EMPTY_VALUES: AddressFormValues = {
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  city: "",
  region: "",
  postalCode: "",
  deliveryInstructions: "",
};

export default function AddressForm({
  initialValue,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: AddressFormProps) {
  const [values, setValues] = useState<AddressFormValues>(
    initialValue
      ? {
          label: initialValue.label,
          fullName: initialValue.fullName,
          phone: initialValue.phone,
          street: initialValue.street,
          city: initialValue.city,
          region: initialValue.region,
          postalCode: initialValue.postalCode,
          deliveryInstructions: initialValue.deliveryInstructions,
        }
      : EMPTY_VALUES
  );

  const setField = (field: keyof AddressFormValues) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Label</span>
          <input
            type="text"
            value={values.label}
            onChange={setField("label")}
            placeholder="Home, Work, etc."
            maxLength={50}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Full name</span>
          <input
            type="text"
            value={values.fullName}
            onChange={setField("fullName")}
            maxLength={100}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Phone</span>
          <input
            type="tel"
            value={values.phone}
            onChange={setField("phone")}
            maxLength={20}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Street address</span>
          <input
            type="text"
            value={values.street}
            onChange={setField("street")}
            maxLength={200}
            required
          />
        </label>

        <label className={styles.field}>
          <span>City</span>
          <input
            type="text"
            value={values.city}
            onChange={setField("city")}
            maxLength={100}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Region</span>
          <input
            type="text"
            value={values.region}
            onChange={setField("region")}
            maxLength={100}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Postal code (optional)</span>
          <input
            type="text"
            value={values.postalCode}
            onChange={setField("postalCode")}
            maxLength={20}
          />
        </label>

        <label className={`${styles.field} ${styles.fullWidth}`}>
          <span>Delivery instructions (optional)</span>
          <input
            type="text"
            value={values.deliveryInstructions}
            onChange={setField("deliveryInstructions")}
            maxLength={500}
          />
        </label>
      </div>

      {error ? <p className={styles.errorMessage}>{error}</p> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}