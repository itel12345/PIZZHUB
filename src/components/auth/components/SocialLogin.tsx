// src/components/auth/components/SocialLogin.tsx
//
// Divider + Google button placeholder. No real OAuth wiring — the
// button is purely presentational for now. TODO: wire to real
// Google OAuth once backend auth exists.

import styles from "./SocialLogin.module.css";

export default function SocialLogin() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.divider}>
        <span className={styles.dividerLine} aria-hidden="true" />
        <span className={styles.dividerText}>or continue with</span>
        <span className={styles.dividerLine} aria-hidden="true" />
      </div>

      <button type="button" className={styles.googleButton}>
        <svg viewBox="0 0 24 24" className={styles.googleIcon} aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.24 1.3-1.68 3.8-5.5 3.8-3.31 0-6.02-2.74-6.02-6.1S8.69 5.7 12 5.7c1.89 0 3.16.8 3.88 1.5l2.64-2.55C16.9 2.98 14.68 2 12 2 6.98 2 2.9 6.03 2.9 11s4.08 9 9.1 9c5.25 0 8.73-3.69 8.73-8.89 0-.6-.06-1.05-.14-1.51H12Z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}