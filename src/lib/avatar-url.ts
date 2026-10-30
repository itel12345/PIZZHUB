// src/lib/avatar-url.ts
//
// Answers one question: "is this profile-picture URL inside THIS
// environment's avatar bucket?" Shared by the server (login response)
// and the browser (the cached user in localStorage, and UserAvatar), so
// both ends use the same rule. Deliberately NOT server-only and imports
// nothing server-side, same as lib/validation/avatar.ts.
//
// Why this exists: a User.image (or a cached copy of it in localStorage)
// written while the app pointed at one Supabase project keeps naming
// that project's host after SUPABASE_URL is switched to another one
// (e.g. production -> dev). next/image only allows the CURRENT project's
// host (see next.config.ts), so rendering the old URL throws a
// "hostname is not configured" error instead of showing a picture.
// URLs from another project are treated as "no picture" for display and
// the initial-letter circle is shown. Nothing is rewritten or deleted:
// the old file and the old database value are left exactly as they are,
// and the next upload replaces the value normally.
//
// The base string comes from NEXT_PUBLIC_AVATAR_PUBLIC_BASE, which
// next.config.ts derives from SUPABASE_URL + the bucket name (the same
// two inputs lib/avatar.ts uses to build every URL it stores). It holds
// only the public storage prefix that is already part of every avatar
// URL the browser receives. It is not a secret, and the service-role
// key is never involved. The variable is read as a literal
// `process.env.NEXT_PUBLIC_...` expression because Next only inlines
// that exact form into browser code.

export function getAvatarPublicBase(): string | null {
  const base = process.env.NEXT_PUBLIC_AVATAR_PUBLIC_BASE;
  return base && base.length > 0 ? base : null;
}

/**
 * True only when `url` lives inside this environment's avatar bucket.
 * The base ends in "/storage/v1/object/public/<bucket>/", so a lookalike
 * host such as "https://project.supabase.co.evil.test/..." cannot match.
 * When no base is configured (SUPABASE_URL unset) nothing is trusted,
 * which matches next.config.ts omitting the remote pattern in that case.
 */
export function isTrustedAvatarUrl(
  url: string | null | undefined,
  base: string | null = getAvatarPublicBase()
): url is string {
  return Boolean(url && base && url.startsWith(base));
}
