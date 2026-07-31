// src/components/checkout/components/DeliveryAddress.tsx
//
// Pure controlled form section for the delivery address. Field names
// (street, city, region, postalCode) are chosen to map directly onto a
// future Address Prisma model, and this same shape is what a future
// "Saved Addresses" feature would reuse — a saved address is just this
// shape, pre-filled.

"use client";

import styles from "./DeliveryAddress.module.css";

export interface DeliveryAddressValues {
  street: string;
  city: string;
  region: string;
  postalCode: string;
  deliveryInstructions: string;
}

export interface DeliveryAddressErrors {
  street?: string;
  city?: string;
  region?: string;
}

interface DeliveryAddressProps {
  values: DeliveryAddressValues;
  errors: DeliveryAddressErrors;
  onChange: (field: keyof DeliveryAddressValues, value: string) => void;
}

export default function DeliveryAddress({
  values,
  errors,
  onChange,
}: DeliveryAddressProps) {
  return (
    <section className={styles.section} aria-labelledby="delivery-address-heading">
      <h2 id="delivery-address-heading" className={styles.heading}>
        Delivery Address
      </h2>

      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label htmlFor="street" className={styles.label}>
            Street Address <span aria-hidden="true">*</span>
          </label>
          <input
            id="street"
            name="street"
            type="text"
            autoComplete="street-address"
            className={styles.input}
            value={values.street}
            onChange={(e) => onChange("street", e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(errors.street)}
            aria-describedby={errors.street ? "street-error" : undefined}
          />
          {errors.street && (
            <p id="street-error" className={styles.error} role="alert">
              {errors.street}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="city" className={styles.label}>
            City <span aria-hidden="true">*</span>
          </label>
          <input
            id="city"
            name="city"
            type="text"
            autoComplete="address-level2"
            className={styles.input}
            value={values.city}
            onChange={(e) => onChange("city", e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "city-error" : undefined}
          />
          {errors.city && (
            <p id="city-error" className={styles.error} role="alert">
              {errors.city}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="region" className={styles.label}>
            Region / State <span aria-hidden="true">*</span>
          </label>
          <input
            id="region"
            name="region"
            type="text"
            autoComplete="address-level1"
            className={styles.input}
            value={values.region}
            onChange={(e) => onChange("region", e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(errors.region)}
            aria-describedby={errors.region ? "region-error" : undefined}
          />
          {errors.region && (
            <p id="region-error" className={styles.error} role="alert">
              {errors.region}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="postalCode" className={styles.label}>
            Postal Code <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            autoComplete="postal-code"
            className={styles.input}
            value={values.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
          />
        </div>

        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label htmlFor="deliveryInstructions" className={styles.label}>
            Delivery Instructions <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            id="deliveryInstructions"
            name="deliveryInstructions"
            rows={3}
            className={styles.textarea}
            value={values.deliveryInstructions}
            onChange={(e) => onChange("deliveryInstructions", e.target.value)}
            placeholder="Gate code, landmark, floor number, etc."
          />
        </div>
      </div>
    </section>
  );
}