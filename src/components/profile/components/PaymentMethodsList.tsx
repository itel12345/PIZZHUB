// src/components/profile/components/PaymentMethodsList.tsx
//
// No separate fetch, no loading/error state of its own: this reuses
// usePublicSettings() exactly as Navbar/CartSummary/OrderReview already
// do — that hook is deliberately designed to always have a usable
// value instantly (schema-default fallback, silent background
// correction), never a visible loading/error state. Inventing a fake
// spinner or error banner here would mean either faking a state that
// doesn't exist, or changing that hook's contract for its three other
// existing consumers — out of scope for this feature.

"use client";

import { usePublicSettings } from "@/hooks/usePublicSettings";
import styles from "./PaymentMethodsList.module.css";

interface PaymentMethodInfo {
  key: "cod" | "mobileMoney" | "card";
  label: string;
  description: string;
  isEnabled: boolean;
}

export function PaymentMethodsList() {
  const { codEnabled, mobileMoneyEnabled, cardEnabled } = usePublicSettings();

  const methods: PaymentMethodInfo[] = [
    {
      key: "cod",
      label: "Cash on Delivery",
      description: "Pay in cash when your order arrives.",
      isEnabled: codEnabled,
    },
    {
      key: "mobileMoney",
      label: "Mobile Money",
      description: "Pay online via Mobile Money at checkout.",
      isEnabled: mobileMoneyEnabled,
    },
    {
      key: "card",
      label: "Card",
      description: "Pay online with a debit or credit card at checkout.",
      isEnabled: cardEnabled,
    },
  ];

  return (
    <ul className={styles.list}>
      {methods.map((method) => (
        <li key={method.key} className={styles.card}>
          <div className={styles.cardMain}>
            <span className={styles.label}>{method.label}</span>
            <span className={styles.description}>{method.description}</span>
          </div>

          <span
            className={`${styles.statusBadge} ${
              method.isEnabled ? styles.available : styles.unavailable
            }`}
          >
            <span className={styles.dot} aria-hidden="true" />
            {method.isEnabled ? "Available" : "Currently unavailable"}
          </span>
        </li>
      ))}
    </ul>
  );
}