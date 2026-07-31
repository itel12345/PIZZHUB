// src/components/auth/forms/SignupForm.tsx
//
// Signup screen. Now wired to a real POST /api/auth/signup endpoint —
// no longer the frontend-only TODO stub from earlier phases.

"use client";

import { useState } from "react";
import AuthInput from "../components/AuthInput";
import PasswordField from "../components/PasswordField";
import SocialLogin from "../components/SocialLogin";
import styles from "./SignupForm.module.css";

interface SignupFormValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>> & {
  terms?: string;
};

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [values, setValues] = useState<SignupFormValues>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof SignupFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): SignupFormErrors => {
    const nextErrors: SignupFormErrors = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Please enter your full name.";
    }
    if (!values.email.trim()) {
      nextErrors.email = "Please enter your email.";
    }
    if (!values.password) {
      nextErrors.password = "Please create a password.";
    } else if (values.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (!values.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Passwords don't match.";
    }
    if (!agreedToTerms) {
      nextErrors.terms = "Please agree to the Terms to continue.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsSubmitting(false);
        alert(data.error ?? "Signup failed.");
        return;
      }

      alert(data.message);
      setValues({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      setAgreedToTerms(false);
      onSwitchToLogin();
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <AuthInput
        id="signup-fullName"
        label="Full Name"
        type="text"
        autoComplete="name"
        required
        value={values.fullName}
        onChange={(value) => updateField("fullName", value)}
        error={errors.fullName}
      />

      <AuthInput
        id="signup-email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={(value) => updateField("email", value)}
        error={errors.email}
      />

      <AuthInput
        id="signup-phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        placeholder="Optional"
        value={values.phone}
        onChange={(value) => updateField("phone", value)}
      />

      <PasswordField
        id="signup-password"
        label="Password"
        autoComplete="new-password"
        required
        value={values.password}
        onChange={(value) => updateField("password", value)}
        error={errors.password}
      />

      <PasswordField
        id="signup-confirmPassword"
        label="Confirm Password"
        autoComplete="new-password"
        required
        value={values.confirmPassword}
        onChange={(value) => updateField("confirmPassword", value)}
        error={errors.confirmPassword}
      />

      <div className={styles.termsRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={agreedToTerms}
            onChange={(e) => {
              setAgreedToTerms(e.target.checked);
              setErrors((prev) => ({ ...prev, terms: undefined }));
            }}
            aria-invalid={Boolean(errors.terms)}
            aria-describedby={errors.terms ? "terms-error" : undefined}
          />
          I agree to the Terms of Service and Privacy Policy
        </label>
        {errors.terms && (
          <p id="terms-error" className={styles.error} role="alert">
            {errors.terms}
          </p>
        )}
      </div>

      <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </button>

      <SocialLogin />

      <p className={styles.bottomText}>
        Already have an account?{" "}
        <button
          type="button"
          className={styles.linkButton}
          onClick={onSwitchToLogin}
        >
          Sign In
        </button>
      </p>
    </form>
  );
}