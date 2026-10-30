"use client";

// src/components/profile/components/settings/ProfilePictureSection.tsx
//
// Settings > Profile picture: choose, preview, save, replace, remove.
// Presentational like its sibling sections — the page hands in the
// actions (see SettingsPage) and this component owns only the
// transient UI state: the pending preview, busy flags, messages.
//
// Nothing is uploaded until "Save picture" is pressed. Choosing a file
// only prepares a local preview, so a wrong pick costs nothing.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { AuthUser } from "@/components/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { PrepareResult, PreparedAvatar } from "../../hooks/useProfilePicture";
import { AVATAR_ALLOWED_TYPES } from "@/lib/validation/avatar";
import sectionStyles from "./SettingsSection.module.css";
import styles from "./ProfilePictureSection.module.css";

interface ProfilePictureSectionProps {
  user: AuthUser;
  prepareAvatar: (file: File) => Promise<PrepareResult>;
  uploadAvatar: (blob: Blob) => Promise<{ error?: string; avatarUrl?: string }>;
  removeAvatar: () => Promise<{ error?: string }>;
  /** Called after the server confirms a change; undefined = picture removed. */
  onChanged: (avatarUrl: string | undefined) => void;
}

type Busy = "preparing" | "saving" | "removing" | null;

export function ProfilePictureSection({
  user,
  prepareAvatar,
  uploadAvatar,
  removeAvatar,
  onChanged,
}: ProfilePictureSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [prepared, setPrepared] = useState<PreparedAvatar | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  // An object URL holds the image in memory until revoked; release it
  // whenever the preview is replaced, discarded, or the page unmounts.
  useEffect(() => {
    if (!prepared) return;
    const url = prepared.previewUrl;
    return () => URL.revokeObjectURL(url);
  }, [prepared]);

  const isBusy = busy !== null;
  const hasPicture = Boolean(user.avatarUrl);

  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Clearing the value lets the same file be picked again after Cancel.
    event.target.value = "";
    if (!file) return;

    setError(null);
    setMessage(null);
    setConfirmingRemove(false);
    setBusy("preparing");

    const result = await prepareAvatar(file);
    setBusy(null);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPrepared(result.prepared);
  };

  const handleSave = async () => {
    if (!prepared) return;

    setError(null);
    setMessage(null);
    setBusy("saving");

    const result = await uploadAvatar(prepared.blob);
    setBusy(null);

    if (result.error || !result.avatarUrl) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    setPrepared(null);
    onChanged(result.avatarUrl);
    setMessage("Profile picture updated.");
  };

  const handleCancel = () => {
    setPrepared(null);
    setError(null);
  };

  const handleRemove = async () => {
    setError(null);
    setMessage(null);
    setBusy("removing");

    const result = await removeAvatar();
    setBusy(null);
    setConfirmingRemove(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onChanged(undefined);
    setMessage("Profile picture removed.");
  };

  return (
    <section className={sectionStyles.panel} aria-labelledby="profile-picture-heading">
      <h2 id="profile-picture-heading" className={sectionStyles.heading}>
        Profile picture
      </h2>
      <p className={sectionStyles.description}>
        This appears next to your name across PizzHub.
      </p>

      <div className={styles.row}>
        <div
          className={`${styles.preview} ${prepared ? styles.previewPending : ""}`}
          aria-hidden="true"
        >
          {prepared ? (
            <Image
              src={prepared.previewUrl}
              alt=""
              width={160}
              height={160}
              unoptimized
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <UserAvatar user={user} size={160} />
          )}
        </div>

        <div className={styles.controls}>
          <input
            ref={inputRef}
            type="file"
            // The buttons below are the real controls (they call
            // inputRef.click()); leaving this tabbable would add an
            // invisible, focus-ring-less stop for keyboard users.
            tabIndex={-1}
            aria-hidden="true"
            accept={AVATAR_ALLOWED_TYPES.join(",")}
            className={styles.visuallyHidden}
            onChange={handleFileChosen}
            disabled={isBusy}
          />

          {prepared ? (
            <div className={styles.actions}>
              <button
                type="button"
                className={sectionStyles.saveButton}
                onClick={handleSave}
                disabled={isBusy}
              >
                {busy === "saving" ? "Saving…" : "Save picture"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleCancel}
                disabled={isBusy}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className={styles.actions}>
              <button
                type="button"
                className={sectionStyles.saveButton}
                onClick={() => inputRef.current?.click()}
                disabled={isBusy}
              >
                {busy === "preparing"
                  ? "Preparing…"
                  : hasPicture
                    ? "Replace photo"
                    : "Choose photo"}
              </button>

              {hasPicture && !confirmingRemove ? (
                <button
                  type="button"
                  className={sectionStyles.dangerButton}
                  onClick={() => setConfirmingRemove(true)}
                  disabled={isBusy}
                >
                  Remove
                </button>
              ) : null}

              {hasPicture && confirmingRemove ? (
                <>
                  <button
                    type="button"
                    className={sectionStyles.dangerButton}
                    onClick={handleRemove}
                    disabled={isBusy}
                  >
                    {busy === "removing" ? "Removing…" : "Yes, remove it"}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setConfirmingRemove(false)}
                    disabled={isBusy}
                  >
                    Keep it
                  </button>
                </>
              ) : null}
            </div>
          )}

          <p className={styles.hint}>
            JPEG, PNG or WebP, up to 10 MB. We crop it to a square.
          </p>
        </div>
      </div>

      {error ? (
        <p className={sectionStyles.errorMessage} role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className={sectionStyles.successMessage} role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
