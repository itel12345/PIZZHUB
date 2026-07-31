// src/components/checkout/components/CustomerInformation.tsx
//
// Pure controlled form section — Full Name, Email, Phone. Holds no state
// and no validation logic of its own; all of that lives centrally in
// CheckoutPage so every section stays a simple, reusable "values in,
// onChange out" component.

"use client";

import styles from "./CustomerInformation.module.css";

export interface CustomerInformationValues {
  fullName: string;
  email: string;
  phone: string;
}

export interface CustomerInformationErrors {
  fullName?: string;
  phone?: string;
}

interface CustomerInformationProps {
  values: CustomerInformationValues;
  errors: CustomerInformationErrors;
  onChange: (field: keyof CustomerInformationValues, value: string) => void;
}

export default function CustomerInformation({
  values,
  errors,
  onChange,
}: CustomerInformationProps) {
  return (
    <section className={styles.section} aria-labelledby="customer-info-heading">
      <h2 id="customer-info-heading" className={styles.heading}>
        Customer Information
      </h2>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="fullName" className={styles.label}>
            Full Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            className={styles.input}
            value={values.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
          />
          {errors.fullName && (
            <p id="fullName-error" className={styles.error} role="alert">
              {errors.fullName}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={styles.input}
            value={values.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="phone" className={styles.label}>
            Phone Number <span aria-hidden="true">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={styles.input}
            value={values.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className={styles.error} role="alert">
              {errors.phone}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}