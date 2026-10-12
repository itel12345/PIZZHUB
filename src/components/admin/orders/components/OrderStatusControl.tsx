// src/components/admin/orders/components/OrderStatusControl.tsx
//
// Deliberately simple: a select + save button, not an inline-auto-save
// dropdown — an accidental status change (PENDING -> CANCELLED) has
// real consequences for a customer, so an explicit "Save" step is
// worth the extra click. On success, router.refresh() re-runs the
// server component (OrderDetailPage's parent page.tsx) so the newly
// saved status is what's actually shown — not a locally-optimistic
// guess.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./OrderStatusControl.module.css";

type Status = "PENDING" | "CONFIRMED" | "CANCELLED";

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: Status;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function OrderStatusControl({
  orderId,
  currentStatus,
}: OrderStatusControlProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Status>(currentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanged = selected !== currentStatus;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selected }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.control}>
      <label htmlFor="order-status-select" className={styles.label}>
        Order status
      </label>
      <div className={styles.row}>
        <select
          id="order-status-select"
          className={styles.select}
          value={selected}
          disabled={isSaving}
          onChange={(event) => setSelected(event.target.value as Status)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={styles.saveButton}
          disabled={!hasChanged || isSaving}
          onClick={handleSave}
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
