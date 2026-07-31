// src/components/auth/components/AuthHeader.tsx
//
// Shared header used by all three screens inside the modal. Optional
// back button (shown only on Forgot Password, to return to Login) and
// a close button, always present.

import styles from "./AuthHeader.module.css";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  onBack?: () => void;
}

export default function AuthHeader({
  title,
  subtitle,
  onClose,
  onBack,
}: AuthHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        {onBack ? (
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <h2 id="auth-modal-title" className={styles.title}>
        {title}
      </h2>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
}