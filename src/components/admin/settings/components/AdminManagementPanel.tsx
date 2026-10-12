// src/components/admin/settings/components/AdminManagementPanel.tsx
//
// The two safeguards visible here (disabling "Remove" for yourself and
// for the last remaining admin) are UX conveniences only — the real
// enforcement is server-side in lib/admin-account.ts's demoteAdmin,
// which re-checks both conditions itself rather than trusting that a
// disabled button was actually respected.

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AdminListItem } from "@/lib/admin-account";
import styles from "./AdminManagementPanel.module.css";

interface AdminManagementPanelProps {
  admins: AdminListItem[];
  currentAdminId: string;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function AdminManagementPanel({
  admins: initialAdmins,
  currentAdminId,
}: AdminManagementPanelProps) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);

  const [email, setEmail] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null);

  const [demotingId, setDemotingId] = useState<string | null>(null);
  const [demoteError, setDemoteError] = useState<string | null>(null);
  const [selfRemovedNotice, setSelfRemovedNotice] = useState(false);

  const handlePromote = async (event: FormEvent) => {
    event.preventDefault();
    setPromoteError(null);
    setPromoteSuccess(null);
    setPromoting(true);

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPromoteError(data.error ?? "Something went wrong.");
        return;
      }

      setAdmins((current) => [...current, data.admin]);
      setPromoteSuccess(`${data.admin.email} is now an admin.`);
      setEmail("");
      router.refresh();
    } catch {
      setPromoteError("Something went wrong. Please try again.");
    } finally {
      setPromoting(false);
    }
  };

  const handleDemote = async (userId: string) => {
    const isSelf = userId === currentAdminId;

    if (isSelf) {
      const confirmed = window.confirm(
        "This removes your own admin access. Your current browser session may still show admin access until you log out — log out right after this for the change to fully apply. Continue?"
      );
      if (!confirmed) return;
    }

    setDemoteError(null);
    setDemotingId(userId);

    try {
      const response = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDemoteError(data.error ?? "Something went wrong.");
        return;
      }

      setAdmins((current) => current.filter((admin) => admin.id !== userId));
      if (data.wasSelf) {
        setSelfRemovedNotice(true);
      }
      router.refresh();
    } catch {
      setDemoteError("Something went wrong. Please try again.");
    } finally {
      setDemotingId(null);
    }
  };

  const isLastAdmin = admins.length <= 1;

  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>Admin access</h2>

      <ul className={styles.list}>
        {admins.map((admin) => {
          const isSelf = admin.id === currentAdminId;
          const disableRemove = admin.isOwner || isLastAdmin;
          const disableReason = admin.isOwner
            ? "This is the original admin account and can't be removed."
            : isLastAdmin
              ? isSelf
                ? "You're the last remaining admin — promote someone else first."
                : "Can't remove the last remaining admin."
              : undefined;

          return (
            <li key={admin.id} className={styles.row}>
              <div>
                <div className={styles.name}>
                  {admin.name}
                  {admin.isOwner ? <span className={styles.ownerTag}>Owner</span> : null}
                  {isSelf ? <span className={styles.youTag}>You</span> : null}
                </div>
                <div className={styles.email}>{admin.email}</div>
                <div className={styles.joined}>Admin since {formatDate(admin.joinedAt)}</div>
              </div>

              <button
                type="button"
                className={styles.removeButton}
                disabled={disableRemove || demotingId === admin.id}
                title={disableReason}
                onClick={() => handleDemote(admin.id)}
              >
                {demotingId === admin.id ? "Removing…" : "Remove admin access"}
              </button>
            </li>
          );
        })}
      </ul>

      {selfRemovedNotice ? (
        <p className={styles.warningMessage}>
          Your admin access has been removed. Log out now for this to fully
          apply — your current session may otherwise still show admin access
          until then.
        </p>
      ) : null}

      {demoteError ? <p className={styles.errorMessage}>{demoteError}</p> : null}

      <h3 className={styles.subheading}>Promote a customer to admin</h3>
      <form onSubmit={handlePromote} className={styles.promoteForm}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="customer@email.com"
          className={styles.emailInput}
          required
        />
        <button type="submit" className={styles.promoteButton} disabled={promoting}>
          {promoting ? "Promoting…" : "Promote"}
        </button>
      </form>

      {promoteError ? <p className={styles.errorMessage}>{promoteError}</p> : null}
      {promoteSuccess ? <p className={styles.successMessage}>{promoteSuccess}</p> : null}
    </section>
  );
}