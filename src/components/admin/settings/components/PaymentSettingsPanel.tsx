// src/components/admin/settings/components/PaymentSettingsPanel.tsx
//
// The "at least one payment method must stay enabled" rule is enforced
// server-side in lib/settings.ts (InvalidSettingsError) — that's the
// real, load-bearing check. This component mirrors it client-side too,
// purely so the Save button can't even be pressed into an invalid
// state, not as a substitute for the server check.

"use client";

import { useState, type FormEvent } from "react";
import type { SiteSettingsDTO } from "@/lib/settings";
import styles from "./PaymentSettingsPanel.module.css";

interface PaymentSettingsPanelProps {
  settings: SiteSettingsDTO;
}

export default function PaymentSettingsPanel({ settings }: PaymentSettingsPanelProps) {
  const [codEnabled, setCodEnabled] = useState(settings.codEnabled);
  const [mobileMoneyEnabled, setMobileMoneyEnabled] = useState(settings.mobileMoneyEnabled);
  const [cardEnabled, setCardEnabled] = useState(settings.cardEnabled);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const noneEnabled = !codEnabled && !mobileMoneyEnabled && !cardEnabled;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (noneEnabled) {
      setError("At least one payment method must stay enabled.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codEnabled, mobileMoneyEnabled, cardEnabled }),
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
      <h2 className={styles.heading}>Payments</h2>
      <p className={styles.description}>
        Disabling a method here stops it from being offered at checkout —
        including on Paystack&apos;s own payment page for Card and Mobile
        Money, not just in this app&apos;s UI.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.toggleRow}>
          <span>Cash on Delivery</span>
          <input
            type="checkbox"
            checked={codEnabled}
            onChange={(event) => setCodEnabled(event.target.checked)}
          />
        </label>

        <label className={styles.toggleRow}>
          <span>Mobile Money</span>
          <input
            type="checkbox"
            checked={mobileMoneyEnabled}
            onChange={(event) => setMobileMoneyEnabled(event.target.checked)}
          />
        </label>

        <label className={styles.toggleRow}>
          <span>Card</span>
          <input
            type="checkbox"
            checked={cardEnabled}
            onChange={(event) => setCardEnabled(event.target.checked)}
          />
        </label>

        {noneEnabled ? (
          <p className={styles.warningMessage}>
            At least one payment method must stay enabled — customers need a
            way to pay.
          </p>
        ) : null}

        {error ? <p className={styles.errorMessage}>{error}</p> : null}
        {success ? <p className={styles.successMessage}>Payment settings saved.</p> : null}

        <button
          type="submit"
          className={styles.saveButton}
          disabled={submitting || noneEnabled}
        >
          {submitting ? "Saving…" : "Save payment settings"}
        </button>
      </form>
    </section>
  );
}