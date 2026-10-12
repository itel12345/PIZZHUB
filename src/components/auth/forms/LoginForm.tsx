// src/components/auth/forms/LoginForm.tsx
//
// Login screen, wired to a real POST /api/auth/login endpoint. On
// success, calls login() from useAuth() — which handles both the
// localStorage persistence AND updating shared React state — instead
// of writing to localStorage by hand and forcing a full page reload.
// Every component reading useAuth() (Navbar, MobileNavLinks, Profile)
// now updates instantly and in sync.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthInput from "../components/AuthInput";
import PasswordField from "../components/PasswordField";
import SocialLogin from "../components/SocialLogin";
import { useAuth } from "../hooks/useAuth";
import styles from "./LoginForm.module.css";

interface LoginFormValues {
  email: string;
  password: string;
}

type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

/**
 * `redirectTo` ultimately comes from a URL query string (see
 * middleware.ts denyAccess -> Navbar -> useAuthModal), which is
 * attacker-controllable — a crafted link like
 * `/?admin_auth_required=1&redirect=https://evil.example` must never
 * be able to send a freshly-authenticated admin off-site. Only accept
 * a same-origin, root-relative path: must start with a single "/" and
 * explicitly not "//" (protocol-relative — browsers treat that as an
 * external redirect) or "/\" (some browsers normalize backslash to
 * forward-slash, same bypass).
 */
function isSafeRedirectTarget(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  return true;
}

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
  onSuccess: () => void;
  /** If set, navigate here after a successful login instead of just
   *  closing the modal in place — used when the user was bounced to
   *  the homepage by a protected admin route. */
  redirectTo?: string | null;
}

export default function LoginForm({
  onSwitchToSignup,
  onSwitchToForgotPassword,
  onSuccess,
  redirectTo,
}: LoginFormProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof LoginFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): LoginFormErrors => {
    const nextErrors: LoginFormErrors = {};
    if (!values.email.trim()) nextErrors.email = "Please enter your email.";
    if (!values.password) nextErrors.password = "Please enter your password.";
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Login failed.");
        return;
      }

      // login() persists token+user to localStorage AND updates shared
      // auth state — no manual localStorage writes, no page reload.
login(data.user, data.token);

// Always close the modal — whether we're also navigating or not.
onSuccess();

if (isSafeRedirectTarget(redirectTo)) {
  // router.refresh() forces server components (the admin layout,
  // the admin page itself) to re-run now that the admin_session
  // cookie the login response just set is actually present —
  // otherwise the RSC tree they navigate into could still be
  // holding the pre-login (logged-out) render.
  router.push(redirectTo as string);
  router.refresh();
}

alert(data.message);

setValues({
  email: "",
  password: "",
});
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <AuthInput
        id="login-email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={(value) => updateField("email", value)}
        error={errors.email}
      />

      <PasswordField
        id="login-password"
        label="Password"
        autoComplete="current-password"
        required
        value={values.password}
        onChange={(value) => updateField("password", value)}
        error={errors.password}
      />

      <div className={styles.row}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me
        </label>

        <button
          type="button"
          className={styles.linkButton}
          onClick={onSwitchToForgotPassword}
        >
          Forgot password?
        </button>
      </div>

      <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? "Checking..." : "Continue"}
      </button>

      <SocialLogin />

      <p className={styles.bottomText}>
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className={styles.linkButton}
          onClick={onSwitchToSignup}
        >
          Create Account
        </button>
      </p>
    </form>
  );
}