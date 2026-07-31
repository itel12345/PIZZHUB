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

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
  onSuccess: () => void;
}

export default function LoginForm({
  onSwitchToSignup,
  onSwitchToForgotPassword,
  onSuccess,
}: LoginFormProps) {
  const { login } = useAuth();
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

// close the modal
onSuccess();

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