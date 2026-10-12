// src/components/profile/components/settings/MarketingSection.tsx
//
// Each toggle saves itself immediately on change (no separate "Save"
// button) — these are two independent booleans with no cross-field
// validation, so there's nothing a combined submit step would add
// besides an extra click. The checkbox is disabled while its own save
// is in flight and reflects whatever the server actually persisted
// once it responds, rather than assuming the change succeeded.

"use client";

import { useState } from "react";
import type { MarketingPreferencesDTO } from "@/lib/account";
import styles from "./SettingsSection.module.css";

interface MarketingSectionProps {
  preferences: MarketingPreferencesDTO | null;
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
  updatePreferences: (
    input: Partial<MarketingPreferencesDTO>
  ) => Promise<{ error?: string }>;
}

export function MarketingSection({
  preferences,
  isLoading,
  hasError,
  retry,
  updatePreferences,
}: MarketingSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<keyof MarketingPreferencesDTO | null>(null);

  const handleToggle = async (field: keyof MarketingPreferencesDTO, checked: boolean) => {
    setError(null);
    setSavingField(field);
    const result = await updatePreferences({ [field]: checked });
    setSavingField(null);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="marketing-heading">
      <h2 id="marketing-heading" className={styles.heading}>
        Marketing
      </h2>
      <p className={styles.description}>
        Choose what PizzHub can send you about deals and new menu items.
      </p>

      {isLoading ? (
        <p className={styles.description}>Loading…</p>
      ) : hasError || !preferences ? (
        <>
          <p className={styles.errorMessage}>Couldn&apos;t load your preferences.</p>
          <button type="button" className={styles.saveButton} onClick={retry}>
            Try again
          </button>
        </>
      ) : (
        <>
          <div>
            <label className={styles.toggleRow}>
              <span className={styles.toggleText}>
                <span className={styles.toggleLabel}>Email marketing</span>
                <span className={styles.toggleDescription}>
                  Deals, new menu items, and PizzHub news by email.
                </span>
              </span>
              <input
                type="checkbox"
                checked={preferences.emailMarketingOptIn}
                disabled={savingField === "emailMarketingOptIn"}
                onChange={(event) =>
                  handleToggle("emailMarketingOptIn", event.target.checked)
                }
              />
            </label>

            <label className={styles.toggleRow}>
              <span className={styles.toggleText}>
                <span className={styles.toggleLabel}>Promotional SMS</span>
                <span className={styles.toggleDescription}>
                  Occasional text messages about limited-time offers.
                </span>
              </span>
              <input
                type="checkbox"
                checked={preferences.smsMarketingOptIn}
                disabled={savingField === "smsMarketingOptIn"}
                onChange={(event) =>
                  handleToggle("smsMarketingOptIn", event.target.checked)
                }
              />
            </label>
          </div>

          {error ? <p className={styles.errorMessage}>{error}</p> : null}
        </>
      )}
    </section>
  );
}
