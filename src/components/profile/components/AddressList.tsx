// src/components/profile/components/AddressList.tsx
//
// Card rendering is an inner component here rather than a separate
// file — same precedent as OrderHistoryList.tsx's OrderRow, which is
// a full row/card with its own local state, kept in the same file as
// the list that owns it rather than split for its own sake.

"use client";

import { useState } from "react";
import { useAddresses, type Address } from "@/components/addresses";
import AddressForm, { type AddressFormValues } from "./AddressForm";
import styles from "./AddressList.module.css";

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isBusy,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isBusy: boolean;
}) {
  return (
    <li className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.label}>{address.label}</span>
        {address.isDefault ? <span className={styles.defaultBadge}>Default</span> : null}
      </div>

      <div className={styles.details}>
        <p className={styles.name}>{address.fullName}</p>
        <p className={styles.line}>{address.phone}</p>
        <p className={styles.line}>
          {[address.street, address.city, address.region].filter(Boolean).join(", ")}
          {address.postalCode ? `, ${address.postalCode}` : ""}
        </p>
        {address.deliveryInstructions ? (
          <p className={styles.instructions}>{address.deliveryInstructions}</p>
        ) : null}
      </div>

      <div className={styles.cardActions}>
        {!address.isDefault ? (
          <button
            type="button"
            className={styles.linkButton}
            onClick={onSetDefault}
            disabled={isBusy}
          >
            Set as default
          </button>
        ) : null}
        <button type="button" className={styles.linkButton} onClick={onEdit} disabled={isBusy}>
          Edit
        </button>
        <button
          type="button"
          className={`${styles.linkButton} ${styles.deleteButton}`}
          onClick={onDelete}
          disabled={isBusy}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function AddressListSkeleton() {
  return (
    <ul className={styles.list} aria-hidden="true">
      {Array.from({ length: 2 }).map((_, index) => (
        <li key={index} className={`${styles.card} ${styles.skeletonCard}`} />
      ))}
    </ul>
  );
}

export function AddressList() {
  const {
    addresses,
    isLoading,
    hasError,
    retry,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddresses();

  const [mode, setMode] = useState<"idle" | "adding" | "editing">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const editingAddress =
    mode === "editing" ? addresses.find((address) => address.id === editingId) : undefined;

  const startAdd = () => {
    setFormError(null);
    setMode("adding");
  };

  const startEdit = (id: string) => {
    setFormError(null);
    setEditingId(id);
    setMode("editing");
  };

  const cancelForm = () => {
    setMode("idle");
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = async (values: AddressFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    const result =
      mode === "editing" && editingId
        ? await updateAddress(editingId, values)
        : await addAddress(values);

    setIsSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    setMode("idle");
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this address? This can't be undone.")) return;
    setBusyId(id);
    await deleteAddress(id);
    setBusyId(null);
  };

  const handleSetDefault = async (id: string) => {
    setBusyId(id);
    await setDefaultAddress(id);
    setBusyId(null);
  };

  if (isLoading) {
    return <AddressListSkeleton />;
  }

  if (hasError) {
    return (
      <div className={styles.empty}>
        <p>Couldn&apos;t load your addresses. This is usually temporary.</p>
        <button type="button" className={styles.retryButton} onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {addresses.length === 0 && mode === "idle" ? (
        <div className={styles.empty}>
          <p>You haven&apos;t saved any addresses yet.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isBusy={busyId === address.id}
              onEdit={() => startEdit(address.id)}
              onDelete={() => handleDelete(address.id)}
              onSetDefault={() => handleSetDefault(address.id)}
            />
          ))}
        </ul>
      )}

      {mode === "idle" ? (
        <button type="button" className={styles.addButton} onClick={startAdd}>
          + Add address
        </button>
      ) : (
        <AddressForm
          initialValue={editingAddress}
          submitLabel={mode === "editing" ? "Save changes" : "Add address"}
          isSubmitting={isSubmitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={cancelForm}
        />
      )}
    </div>
  );
}