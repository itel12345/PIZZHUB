// src/components/admin/products/components/ImageUploadField.tsx
//
// Replaces the old free-text "Image URL" input. Owns the entire upload
// lifecycle (pick/drop -> validate -> upload -> preview -> replace/
// remove) and only ever hands the parent form a finished, hosted URL
// via onChange — same contract the old text input had, so ProductForm
// didn't need to change its notion of what `image` is.
//
// Upload goes straight from the browser to Cloudinary (see
// src/lib/cloudinary.ts for why) using a signature fetched from our
// own admin-only API. Progress comes from XMLHttpRequest specifically
// because fetch() has no upload progress event.

"use client";

import { useCallback, useId, useRef, useState } from "react";
import Image from "next/image";
import styles from "./ImageUploadField.module.css";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSION = 400; // px, on the shorter side
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  error?: string;
}

type Status = "idle" | "validating" | "uploading" | "error";

interface SignedUpload {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("That file doesn't look like a valid image."));
    };
    img.src = objectUrl;
  });
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Use a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Image must be 5MB or smaller.";
  }
  return null;
}

/**
 * XMLHttpRequest, not fetch — fetch has no upload progress event.
 * Returns the in-flight XHR alongside the promise so the caller can
 * abort() it (Cancel button while uploading).
 */
function uploadWithProgress(
  file: File,
  signed: SignedUpload,
  onProgress: (percent: number) => void
): { promise: Promise<{ secure_url: string }>; xhr: XMLHttpRequest } {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<{ secure_url: string }>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signed.apiKey);
    formData.append("timestamp", String(signed.timestamp));
    formData.append("signature", signed.signature);
    formData.append("folder", signed.folder);

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Upload succeeded but the response was invalid."));
        }
      } else {
        reject(new Error("Upload failed. Try again."));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));

    xhr.send(formData);
  });

  return { promise, xhr };
}

export default function ImageUploadField({
  value,
  onChange,
  disabled,
  error: externalError,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrAbortRef = useRef<(() => void) | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const previousValueRef = useRef<string>(value);

  const cleanupPreviousAsset = useCallback((oldUrl: string) => {
    if (!oldUrl) return;
    void fetch("/api/admin/uploads/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: oldUrl }),
    }).catch(() => {
      // Best-effort cleanup — a failed delete-old-asset call must never
      // block or error out the admin's actual save flow.
    });
  }, []);

  const runUpload = useCallback(
    async (file: File) => {
      setLocalError(null);
      setStatus("validating");

      const typeOrSizeError = validateFile(file);
      if (typeOrSizeError) {
        setLocalError(typeOrSizeError);
        setStatus("error");
        return;
      }

      try {
        const { width, height } = await readImageDimensions(file);
        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
          setLocalError(
            `Image is too small (${width}×${height}px). Use at least ${MIN_DIMENSION}×${MIN_DIMENSION}px.`
          );
          setStatus("error");
          return;
        }
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Invalid image.");
        setStatus("error");
        return;
      }

      setStatus("uploading");
      setProgress(0);
      setPendingFile(file);

      try {
        const signRes = await fetch("/api/admin/uploads/sign", { method: "POST" });
        if (!signRes.ok) {
          throw new Error(
            signRes.status === 401 || signRes.status === 403
              ? "Your session expired. Refresh the page and sign in again."
              : "Couldn't start the upload. Try again."
          );
        }
        const signed = (await signRes.json()) as SignedUpload;

        const { promise, xhr } = uploadWithProgress(file, signed, setProgress);
        xhrAbortRef.current = () => xhr.abort();
        const result = await promise;
        xhrAbortRef.current = null;

        const oldUrl = previousValueRef.current;
        onChange(result.secure_url);
        previousValueRef.current = result.secure_url;

        if (oldUrl && oldUrl !== result.secure_url) {
          cleanupPreviousAsset(oldUrl);
        }

        setStatus("idle");
        setPendingFile(null);
      } catch (err) {
        xhrAbortRef.current = null;
        setLocalError(err instanceof Error ? err.message : "Upload failed.");
        setStatus("error");
      }
    },
    [onChange, cleanupPreviousAsset]
  );

  const handleCancel = useCallback(() => {
    xhrAbortRef.current?.();
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file || disabled) return;
      void runUpload(file);
    },
    [disabled, runUpload]
  );

  const handleRemove = useCallback(() => {
    const oldUrl = previousValueRef.current;
    onChange("");
    previousValueRef.current = "";
    setPendingFile(null);
    setStatus("idle");
    setLocalError(null);
    if (oldUrl) cleanupPreviousAsset(oldUrl);
  }, [onChange, cleanupPreviousAsset]);

  const handleRetry = useCallback(() => {
    if (pendingFile) void runUpload(pendingFile);
  }, [pendingFile, runUpload]);

  const errorMessage = localError ?? externalError ?? null;

  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>Product Image</label>

      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ""} ${
          errorMessage ? styles.dropzoneError : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {value && status !== "uploading" ? (
          <div className={styles.previewWrap}>
            <div className={styles.previewImage}>
              <Image
                src={value}
                alt="Product preview"
                fill
                sizes="160px"
                className={styles.previewImg}
              />
            </div>
            <div className={styles.previewActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                Replace
              </button>
              <button
                type="button"
                className={styles.removeButton}
                onClick={handleRemove}
                disabled={disabled}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label htmlFor={inputId} className={styles.dropzoneLabel}>
            {status === "uploading" ? (
              <div className={styles.progressWrap}>
                <div
                  className={styles.progressTrack}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Upload progress"
                >
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <span className={styles.progressLabel}>Uploading… {progress}%</span>
                <button
                  type="button"
                  className={styles.cancelUploadButton}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancel();
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <UploadIcon />
                <span className={styles.dropzoneText}>
                  <strong>Click to upload</strong> or drag and drop
                </span>
                <span className={styles.dropzoneHint}>
                  JPEG, PNG, or WebP, up to 5MB, at least {MIN_DIMENSION}×{MIN_DIMENSION}px
                </span>
              </>
            )}
          </label>
        )}

        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          disabled={disabled || status === "uploading"}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ""; // allow re-selecting the same file after an error
          }}
          className={styles.fileInput}
          aria-describedby={errorMessage ? `${inputId}-error` : undefined}
          aria-invalid={Boolean(errorMessage)}
        />
      </div>

      {status === "error" && errorMessage && (
        <div className={styles.errorRow}>
          <p id={`${inputId}-error`} className={styles.fieldError} role="alert">
            {errorMessage}
          </p>
          {pendingFile && (
            <button type="button" className={styles.retryButton} onClick={handleRetry}>
              Try again
            </button>
          )}
        </div>
      )}

      {status !== "error" && errorMessage && (
        <p id={`${inputId}-error`} className={styles.fieldError} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="upload-icon"
      width="28"
      height="28"
    >
      <path
        d="M12 16V4m0 0-4 4m4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
