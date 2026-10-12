// src/components/profile/components/settings/SecuritySection.tsx
//
// Client-side length/match checks here are a UX nicety only — the
// real, authoritative validation (same rules) happens again on the
// server via changeUserPasswordSchema.
//
// A successful change invalidates EVERY session for this account,
// including this tab's own (see lib/account.ts's changeUserPassword)
// — there's no way to bump a revocation counter that exempts "the
// request currently bumping it" without undermining the counter
// itself. What keeps this tab logged in is that the server also hands
// back a freshly signed token for the new authVersion, which the
// parent (SettingsPage) swaps into AuthContext right after this
// resolves — see its handleChangePassword.

"use client";

import { useState, type FormEvent } from "react";
import styles from "./SettingsSection.module.css";

interface SecuritySectionProps {
  changePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ error?: string }>;
}

export function SecuritySection({ changePassword }: SecuritySectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setSubmitting(true);
    const result = await changePassword({ currentPassword, newPassword });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess(true);
  };

  return (
    <section className={styles.panel} aria-labelledby="security-heading">
      <h2 id="security-heading" className={styles.heading}>
        Security
      </h2>
      <p className={styles.description}>Update the password you use to sign in.</p>

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
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        {error ? <p className={styles.errorMessage}>{error}</p> : null}
        {success ? (
          <p className={styles.successMessage}>
            Password updated. You&apos;ve been signed out on your other devices.
          </p>
        ) : null}

        <button type="submit" className={styles.saveButton} disabled={submitting}>
          {submitting ? "Saving…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
