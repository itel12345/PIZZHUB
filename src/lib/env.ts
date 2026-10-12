// src/lib/env.ts
//
// Fails fast and loudly at startup/first-use if a required env var is
// missing, instead of the previous pattern (`process.env.JWT_SECRET!`)
// which silently hands `jwt.sign`/`jwt.verify` the string "undefined"
// and only blows up — confusingly — the first time someone logs in.
//
// Deliberately scoped to the vars the code in this repo actually reads
// today (auth + image uploads). Not a general-purpose env schema for
// the whole app, since we haven't audited every module yet.

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in your environment (or .env.local for local dev) before starting the app.`
    );
  }
  return value;
}

export function getJwtSecret(): string {
  return required("JWT_SECRET");
}

export function getCloudinaryConfig() {
  return {
    cloudName: required("CLOUDINARY_CLOUD_NAME"),
    apiKey: required("CLOUDINARY_API_KEY"),
    apiSecret: required("CLOUDINARY_API_SECRET"),
  };
}

export function getPaystackSecretKey(): string {
  return required("PAYSTACK_SECRET_KEY");
}

/** The one admin account that can never be demoted by anyone —
 * including itself. An env var, not a hardcoded string in source: this
 * is deployment-specific config (who owns THIS store), not something
 * that belongs baked into the codebase. */
export function getOwnerAdminEmail(): string {
  return required("OWNER_ADMIN_EMAIL");
}