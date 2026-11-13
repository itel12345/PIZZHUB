// src/components/auth/pages/ResetPasswordPanel.tsx
//
// Landing page for the link in the password-reset email: choose a new
// password, or (if the link is bad/expired) request a fresh one using the
// same ForgotPasswordForm the sign-in modal uses.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "../components/PasswordField";
import ForgotPasswordForm from "../forms/ForgotPasswordForm";
import { resetPassword, validateNewPassword } from "@/lib/auth-client";
import formStyles from "../forms/ForgotPasswordForm.module.css";
import styles from "./AuthPage.module.css";

type View = "form" | "done" | "request";

// The home page opens the sign-in modal for this query string (the same
// mechanism admin routes use to bounce signed-out visitors); "/" is the
// post-login destination.
const SIGN_IN_HREF = "/?admin_auth_required=1&redirect=%2F";

export default function ResetPasswordPanel({ token }: { token: string | null }) {
  const router = useRouter();
  const [view, setView] = useState<View>(token ? "form" : "request");
  const [notice, setNotice] = useState<string | undefined>(
    token ? undefined : "This reset link is incomplete."
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || isSubmitting) return;

    const pwProblem = validateNewPassword(password);
    const matchProblem = password !== confirm ? "Passwords don't match." : undefined;
    setPasswordError(pwProblem ?? undefined);
    setConfirmError(pwProblem ? undefined : matchProblem);
    setFormError(undefined);
    if (pwProblem || matchProblem) return;

    setIsSubmitting(true);
    const result = await resetPassword(token, password);
    setIsSubmitting(false);

    if (result.ok) {
      setPassword("");
      setConfirm("");
      setView("done");
    } else if (result.kind === "invalid_link") {
      setNotice(result.message);
      setView("request");
    } else if (result.kind === "invalid_input") {
      setPasswordError(result.message);
    } else {
      setFormError(result.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {view === "request" ? "Request a new link" : "Choose a new password"}
          </h1>
          <p className={styles.subtitle}>
            {view === "done"
              ? "Your password has been changed."
              : view === "request"
                ? "We'll email you a fresh reset link."
                : "Pick something you haven't used before."}
          </p>
        </div>

        {view === "form" && (
          <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
            <PasswordField
              id="reset-password"
              label="New password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError(undefined);
              }}
              error={passwordError}
            />
            <PasswordField
              id="reset-password-confirm"
              label="Confirm new password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(value) => {
                setConfirm(value);
                if (confirmError) setConfirmError(undefined);
              }}
              error={confirmError}
            />
            {formError && (
              <p className={styles.errorText} role="alert">
                {formError}
              </p>
            )}
            <button type="submit" className={formStyles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        {view === "done" && (
          <div className={formStyles.successState}>
            <div className={formStyles.successIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className={formStyles.successText}>
              Your password has been updated. You were signed out of every
              device, so please sign in with your new password.
            </p>
            <Link href={SIGN_IN_HREF} className={`${formStyles.submitButton} ${styles.asLink}`}>
              Sign in
            </Link>
          </div>
        )}

        {view === "request" && (
          <div className={styles.stack}>
            {notice && (
              <p className={styles.errorText} role="alert">
                {notice}
              </p>
            )}
            <ForgotPasswordForm onSwitchToLogin={() => router.push(SIGN_IN_HREF)} />
          </div>
        )}
      </div>
    </div>
  );
}
