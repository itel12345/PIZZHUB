// src/components/admin/settings/components/AccountPanel.tsx
//
// The password form lives inside this same panel rather than a
// separate ChangePasswordForm file — it's the only interactive thing
// this panel does, and Account/password-change are the same "manage
// my own login" concern, not two features sharing a page by accident.

"use client";

import { useState, type FormEvent } from "react";
import styles from "./AccountPanel.module.css";

interface AccountPanelProps {
  account: { email: string; role: string };
}

export default function AccountPanel({ account }: AccountPanelProps) {
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
    try {
      const response = await fetch("/api/admin/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>Account</h2>

      <dl className={styles.infoList}>
        <div className={styles.infoRow}>
          <dt>Email</dt>
          <dd>{account.email}</dd>
        </div>
        <div className={styles.infoRow}>
          <dt>Role</dt>
          <dd>{account.role}</dd>
        </div>
      </dl>

      <h3 className={styles.subheading}>Change password</h3>

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
        {success ? <p className={styles.successMessage}>Password updated.</p> : null}

        <button type="submit" className={styles.saveButton} disabled={submitting}>
          {submitting ? "Saving…" : "Update password"}
        </button>
      </form>
    </section>
  );
}