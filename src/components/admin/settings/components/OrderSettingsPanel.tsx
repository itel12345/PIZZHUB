// src/components/admin/settings/components/OrderSettingsPanel.tsx

"use client";

import { useState, type FormEvent } from "react";
import type { SiteSettingsDTO } from "@/lib/settings";
import styles from "./OrderSettingsPanel.module.css";

interface OrderSettingsPanelProps {
  settings: SiteSettingsDTO;
}

export default function OrderSettingsPanel({ settings }: OrderSettingsPanelProps) {
  const [deliveryFee, setDeliveryFee] = useState(String(settings.deliveryFee));
  const [taxRate, setTaxRate] = useState(String(settings.taxRate));
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState(settings.isDeliveryAvailable);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const feeValue = Number(deliveryFee);
    const taxValue = Number(taxRate);

    if (!Number.isFinite(feeValue) || feeValue < 0) {
      setError("Delivery fee must be a valid, non-negative number.");
      return;
    }

    if (!Number.isFinite(taxValue) || taxValue < 0 || taxValue > 100) {
      setError("Tax rate must be between 0 and 100.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryFee: feeValue,
          taxRate: taxValue,
          isDeliveryAvailable,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>Orders &amp; delivery</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Delivery fee (GHS)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={deliveryFee}
              onChange={(event) => setDeliveryFee(event.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Tax rate (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxRate}
              onChange={(event) => setTaxRate(event.target.value)}
              required
            />
          </label>
        </div>

        <label className={styles.toggleRow}>
          <span>Delivery available (pickup is always allowed)</span>
          <input
            type="checkbox"
            checked={isDeliveryAvailable}
            onChange={(event) => setIsDeliveryAvailable(event.target.checked)}
          />
        </label>

        {error ? <p className={styles.errorMessage}>{error}</p> : null}
        {success ? (
          <p className={styles.successMessage}>
            Order settings saved — new orders will use these values.
          </p>
        ) : null}

        <button type="submit" className={styles.saveButton} disabled={submitting}>
          {submitting ? "Saving…" : "Save order settings"}
        </button>
      </form>
    </section>
  );
}