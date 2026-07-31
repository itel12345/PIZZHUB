// src/components/checkout/components/DeliveryMethod.tsx
//
// Accessible radio group rendered from a config array. Real <input
// type="radio"> elements styled as cards — never clickable <div>s — so
// keyboard and screen-reader behavior stays native and correct.

"use client";

import styles from "./DeliveryMethod.module.css";

export type DeliveryMethodValue = "standard" | "express" | "pickup";

interface DeliveryOption {
  value: DeliveryMethodValue;
  label: string;
  description: string;
}

const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    value: "standard",
    label: "Standard Delivery",
    description: "Arrives in 45–60 minutes",
  },
  {
    value: "express",
    label: "Express Delivery",
    description: "Arrives in 20–30 minutes",
  },
  {
    value: "pickup",
    label: "Pickup",
    description: "Ready in 15–20 minutes at our nearest location",
  },
];

interface DeliveryMethodProps {
  value: DeliveryMethodValue | null;
  error?: string;
  onChange: (value: DeliveryMethodValue) => void;
}

export default function DeliveryMethod({
  value,
  error,
  onChange,
}: DeliveryMethodProps) {
  return (
    <section className={styles.section} aria-labelledby="delivery-method-heading">
      <h2 id="delivery-method-heading" className={styles.heading}>
        Delivery Method <span aria-hidden="true">*</span>
      </h2>

      <div
        className={styles.options}
        role="radiogroup"
        aria-labelledby="delivery-method-heading"
        aria-required="true"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "delivery-method-error" : undefined}
      >
        {DELIVERY_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <label
              key={option.value}
              className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`}
            >
              <input
                type="radio"
                name="deliveryMethod"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className={styles.radioInput}
              />
              <span className={styles.optionContent}>
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionDescription}>{option.description}</span>
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p id="delivery-method-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}