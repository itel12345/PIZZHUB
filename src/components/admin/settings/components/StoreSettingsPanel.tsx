// src/components/admin/settings/components/StoreSettingsPanel.tsx
//
// Each Settings panel owns and PATCHes only its own slice of
// SiteSettings — /api/admin/settings accepts a partial update, so this
// panel never needs to know about delivery fee, tax, or payment
// toggles to safely save its own fields.

"use client";

import { useState, type FormEvent } from "react";
import type { SiteSettingsDTO } from "@/lib/settings";
import styles from "./StoreSettingsPanel.module.css";

interface StoreSettingsPanelProps {
  settings: SiteSettingsDTO;
}

export default function StoreSettingsPanel({ settings }: StoreSettingsPanelProps) {
  const [storeName, setStoreName] = useState(settings.storeName);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [region, setRegion] = useState(settings.region);
  const [openingTime, setOpeningTime] = useState(settings.openingTime);
  const [closingTime, setClosingTime] = useState(settings.closingTime);
  const [isStoreOpen, setIsStoreOpen] = useState(settings.isStoreOpen);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          contactPhone,
          contactEmail,
          address,
          city,
          region,
          openingTime,
          closingTime,
          isStoreOpen,
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
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>Store &amp; business</h2>
        <span className={`${styles.statusBadge} ${isStoreOpen ? styles.open : styles.closed}`}>
          {isStoreOpen ? "Open" : "Closed"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.toggleRow}>
          <span>Store is open for orders</span>
          <input
            type="checkbox"
            checked={isStoreOpen}
            onChange={(event) => setIsStoreOpen(event.target.checked)}
          />
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Store name</span>
            <input
              type="text"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              maxLength={100}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Contact phone</span>
            <input
              type="text"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              maxLength={30}
              placeholder="e.g. 024 000 0000"
            />
          </label>

          <label className={styles.field}>
            <span>Contact email</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              maxLength={200}
              placeholder="hello@yourstore.com"
            />
          </label>

          <label className={styles.field}>
            <span>Address</span>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={200}
            />
          </label>

          <label className={styles.field}>
            <span>City</span>
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={100}
            />
          </label>

          <label className={styles.field}>
            <span>Region</span>
            <input
              type="text"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              maxLength={100}
            />
          </label>

          <label className={styles.field}>
            <span>Opening time</span>
            <input
              type="time"
              value={openingTime}
              onChange={(event) => setOpeningTime(event.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Closing time</span>
            <input
              type="time"
              value={closingTime}
              onChange={(event) => setClosingTime(event.target.value)}
              required
            />
          </label>
        </div>

        {error ? <p className={styles.errorMessage}>{error}</p> : null}
        {success ? <p className={styles.successMessage}>Store settings saved.</p> : null}

        <button type="submit" className={styles.saveButton} disabled={submitting}>
          {submitting ? "Saving…" : "Save store settings"}
        </button>
      </form>
    </section>
  );
}