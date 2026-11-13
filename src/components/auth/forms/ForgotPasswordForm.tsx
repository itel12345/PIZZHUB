// src/components/auth/forms/ForgotPasswordForm.tsx
//
// Simple elegant reset-request screen. Submits to the real
// POST /api/auth/forgot-password endpoint. The success state is shown
// ONLY when the server accepted the request; if email delivery isn't
// configured (or the caller is rate-limited) the server's honest message
// is shown instead. Always offers a way back to Login.

"use client";

import { useState } from "react";
import AuthInput from "../components/AuthInput";
import { requestPasswordReset } from "@/lib/auth-client";
import styles from "./ForgotPasswordForm.module.css";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export default function ForgotPasswordForm({
  onSwitchToLogin,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setError(undefined);

    setIsSubmitting(true);
    const result = await requestPasswordReset(email);
    setIsSubmitting(false);

    if (result.ok) {
      setIsSubmitted(true);
    } else {
      setError(result.message);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12l5 5L20 6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className={styles.successText}>
          If an account exists for <strong>{email}</strong>, a reset link is
          on its way.
        </p>
        <button
          type="button"
          className={styles.linkButton}
          onClick={onSwitchToLogin}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <AuthInput
        id="forgot-email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(value) => {
          setEmail(value);
          if (error) setError(undefined);
        }}
        error={error}
      />

      <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Reset Link"}
      </button>

      <button
        type="button"
        className={styles.linkButton}
        onClick={onSwitchToLogin}
      >
        Back to Login
      </button>
    </form>
  );
}