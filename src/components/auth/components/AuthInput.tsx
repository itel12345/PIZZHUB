// src/components/auth/components/AuthInput.tsx
//
// Reusable text input shared by all three auth forms. Controlled,
// no internal state — same "values in, onChange out" pattern used by
// Checkout's form sections, so validation stays owned by whichever
// form is using it.

import type { InputHTMLAttributes } from "react";
import styles from "./AuthInput.module.css";

interface AuthInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "onChange"> {
  id: string;
  label: string;
  error?: string;
  onChange: (value: string) => void;
}

export default function AuthInput({
  id,
  label,
  error,
  onChange,
  required,
  ...rest
}: AuthInputProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        className={styles.input}
        onChange={(e) => onChange(e.target.value)}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}