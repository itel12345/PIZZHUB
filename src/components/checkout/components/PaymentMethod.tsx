// src/components/checkout/components/PaymentMethod.tsx
//
// Same config-array + accessible-radio-group pattern as DeliveryMethod.
// Adding Card / Apple Pay / Google Pay / PayPal later is purely additive
// to PAYMENT_OPTIONS (plus icons) — no structural change needed here.

"use client";

import styles from "./PaymentMethod.module.css";

export type PaymentMethodValue = "cod" | "momo";

interface PaymentOption {
  value: PaymentMethodValue;
  label: string;
  description: string;
  comingSoon?: boolean;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    value: "cod",
    label: "Cash on Delivery",
    description: "Pay with cash when your order arrives",
  },
  {
    value: "momo",
    label: "Mobile Money",
    description: "Pay instantly via MTN, Vodafone, or AirtelTigo",
    // comingSoon flag removed now that /api/checkout actually routes
    // this through Paystack — see PaymentOption's comingSoon field
    // (kept in the type for any future option that isn't wired up
    // yet, just not used by this one anymore).
  },
];

interface PaymentMethodProps {
  value: PaymentMethodValue | null;
  error?: string;
  onChange: (value: PaymentMethodValue) => void;
}

export default function PaymentMethod({
  value,
  error,
  onChange,
}: PaymentMethodProps) {
  return (
    <section className={styles.section} aria-labelledby="payment-method-heading">
      <h2 id="payment-method-heading" className={styles.heading}>
        Payment Method <span aria-hidden="true">*</span>
      </h2>

      <div
        className={styles.options}
        role="radiogroup"
        aria-labelledby="payment-method-heading"
        aria-required="true"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "payment-method-error" : undefined}
      >
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <label
              key={option.value}
              className={`${styles.option} ${isSelected ? styles.optionSelected : ""} ${
                option.comingSoon ? styles.optionDisabled : ""
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={isSelected}
                disabled={option.comingSoon}
                onChange={() => onChange(option.value)}
                className={styles.radioInput}
              />
              <span className={styles.optionContent}>
                <span className={styles.optionLabel}>
                  {option.label}
                  {option.comingSoon && (
                    <span className={styles.comingSoonBadge}>Coming soon</span>
                  )}
                </span>
                <span className={styles.optionDescription}>{option.description}</span>
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p id="payment-method-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}