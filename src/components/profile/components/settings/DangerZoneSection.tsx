// src/components/profile/components/settings/DangerZoneSection.tsx
//
// Two layers of confirmation before the request even fires: the
// current password (server re-verifies it — see lib/account.ts) and
// typing DELETE, plus a native window.confirm as the final gate, same
// precedent AdminManagementPanel already uses for "remove this
// admin". Doesn't own what happens after a successful deletion — that
// requires touching auth state (logout) and navigation, both of which
// belong to whatever's holding useAuth/useRouter, so it's reported
// upward via onDeleted rather than this component reaching for those
// hooks itself.

"use client";

import { useState, type FormEvent } from "react";
import styles from "./SettingsSection.module.css";

interface DangerZoneSectionProps {
  deleteAccount: (currentPassword: string) => Promise<{ error?: string }>;
  onDeleted: () => void;
}

const CONFIRM_PHRASE = "DELETE";

export function DangerZoneSection({ deleteAccount, onDeleted }: DangerZoneSectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = currentPassword.length > 0 && confirmText === CONFIRM_PHRASE;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!canSubmit) return;

    const confirmed = window.confirm(
      "This permanently deletes your PizzHub account. Your past orders are kept for our business records, but everything identifying you will be removed. This can't be undone. Continue?"
    );
    if (!confirmed) return;

    setSubmitting(true);
    const result = await deleteAccount(currentPassword);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onDeleted();
  };

  return (
    <section className={styles.dangerPanel} aria-labelledby="danger-zone-heading">
      <h2 id="danger-zone-heading" className={styles.dangerHeading}>
        Danger Zone
      </h2>
      <p className={styles.description}>
        Permanently delete your account. Past orders stay in our records for accounting
        purposes, but your name, email, and saved details are removed. This can&apos;t
        be undone.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.field}>
          <span>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <label className={styles.field}>
          <span>
            Type <strong>{CONFIRM_PHRASE}</strong> to confirm
          </span>
          <input
            type="text"
            className={styles.confirmInput}
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            autoComplete="off"
            required
          />
        </label>

        {error ? <p className={styles.errorMessage}>{error}</p> : null}

        <button
          type="submit"
          className={styles.dangerButton}
          disabled={!canSubmit || submitting}
        >
          {submitting ? "Deleting…" : "Delete my account"}
        </button>
      </form>
    </section>
  );
}
