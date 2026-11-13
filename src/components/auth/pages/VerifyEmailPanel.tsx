// src/components/auth/pages/VerifyEmailPanel.tsx
//
// Landing page for the link in the verification email. The token is only
// spent when the person presses the button, so an email scanner or
// link-preview bot that merely opens the URL cannot use it up.

"use client";

import { useState } from "react";
import Link from "next/link";
import AuthInput from "../components/AuthInput";
import { confirmEmail, resendVerificationEmail } from "@/lib/auth-client";
import formStyles from "../forms/ForgotPasswordForm.module.css";
import styles from "./AuthPage.module.css";

type View = "confirm" | "done" | "resend" | "resent";

export default function VerifyEmailPanel({ token }: { token: string | null }) {
  const [view, setView] = useState<View>(token ? "confirm" : "resend");
  const [message, setMessage] = useState<string | undefined>(
    token ? undefined : "This verification link is incomplete."
  );
  const [isBusy, setIsBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  const handleConfirm = async () => {
    if (!token || isBusy) return;
    setIsBusy(true);
    setMessage(undefined);
    const result = await confirmEmail(token);
    setIsBusy(false);

    if (result.ok) {
      setView("done");
    } else if (result.kind === "invalid_link") {
      setMessage(result.message);
      setView("resend");
    } else {
      setMessage(result.message);
    }
  };

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;
    if (!email.trim()) {
      setEmailError("Please enter your email.");
      return;
    }
    setEmailError(undefined);
    setIsBusy(true);
    const result = await resendVerificationEmail(email);
    setIsBusy(false);

    if (result.ok) {
      setView("resent");
    } else {
      setEmailError(result.message);
    }
  };

  const check = (
    <div className={formStyles.successIcon} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h1 className={styles.title}>Verify your email</h1>
          <p className={styles.subtitle}>
            {view === "done"
              ? "You're all set."
              : "Confirm that this address belongs to you."}
          </p>
        </div>

        {view === "confirm" && (
          <div className={styles.stack}>
            <p className={styles.noticeText}>
              Press the button below to finish verifying your email address.
            </p>
            {message && (
              <p className={styles.errorText} role="alert">
                {message}
              </p>
            )}
            <button
              type="button"
              className={formStyles.submitButton}
              onClick={handleConfirm}
              disabled={isBusy}
            >
              {isBusy ? "Verifying..." : "Verify my email"}
            </button>
          </div>
        )}

        {view === "done" && (
          <div className={formStyles.successState}>
            {check}
            <p className={formStyles.successText}>
              Your email address is verified.
            </p>
            <Link href="/" className={`${formStyles.submitButton} ${styles.asLink}`}>
              Continue to PizzHub
            </Link>
          </div>
        )}

        {view === "resend" && (
          <form className={formStyles.form} onSubmit={handleResend} noValidate>
            {message && (
              <p className={styles.errorText} role="alert">
                {message}
              </p>
            )}
            <p className={styles.noticeText}>
              Enter your email and we&apos;ll send you a new verification link.
            </p>
            <AuthInput
              id="verify-resend-email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(value) => {
                setEmail(value);
                if (emailError) setEmailError(undefined);
              }}
              error={emailError}
            />
            <button type="submit" className={formStyles.submitButton} disabled={isBusy}>
              {isBusy ? "Sending..." : "Send a new verification link"}
            </button>
          </form>
        )}

        {view === "resent" && (
          <div className={formStyles.successState}>
            {check}
            <p className={formStyles.successText}>
              If <strong>{email}</strong> has an unverified account, a new
              verification email is on its way.
            </p>
            <Link href="/" className={formStyles.linkButton}>
              Back to PizzHub
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
