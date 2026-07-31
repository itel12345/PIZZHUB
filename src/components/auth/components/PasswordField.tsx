// src/components/auth/components/PasswordField.tsx
//
// Reusable password input with a show/hide toggle. Built on the same
// controlled "values in, onChange out" contract as AuthInput, but kept
// as its own component rather than an AuthInput variant since the eye
// icon toggle needs its own local visibility state and a differently
// shaped right-hand side (icon button inside the field).

"use client";

import { useState } from "react";
import styles from "./PasswordField.module.css";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  autoComplete,
  placeholder,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>

      <div className={styles.inputWrapper}>
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />

        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`${styles.icon} ${isVisible ? styles.iconVisible : ""}`}
          >
            <path
              d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <line
              className={styles.iconSlash}
              x1="3"
              y1="21"
              x2="21"
              y2="3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}