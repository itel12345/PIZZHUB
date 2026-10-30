"use client";

// src/components/shared/UserAvatar/UserAvatar.tsx
//
// The one place that decides how a user's avatar content renders: their
// picture when they have one, otherwise the first letter of their name.
// Used by the Navbar button, the mobile drawer (two spots) and the
// Profile header so all four always agree — including when the stored
// picture fails to load (deleted, replaced from another device, host
// unreachable), in which case it falls back to the letter instead of
// showing a broken-image icon.
//
// Renders ONLY the inside of the circle. Each caller's own container
// still owns the size, border and background, so none of their layouts
// change. `size` is the pixel width requested from the image optimizer
// (pass ~2x the on-screen size for sharp results on high-DPI screens),
// not the on-screen size.

import { useState } from "react";
import Image from "next/image";
import type { AuthUser } from "@/components/auth/types/auth";
import { isTrustedAvatarUrl } from "@/lib/avatar-url";

interface UserAvatarProps {
  user: Pick<AuthUser, "name" | "avatarUrl">;
  size: number;
  /** Empty by default: the name is shown next to the avatar in every
   * current use, so repeating it would just make screen readers say it twice. */
  alt?: string;
}

export function UserAvatar({ user, size, alt = "" }: UserAvatarProps) {
  // Remembers WHICH url failed (not just "something failed") so that
  // uploading a new picture, which changes the url, gets a fresh try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  // next/image THROWS (it doesn't fire onError) for a host that isn't in
  // next.config.ts's allow-list, so a URL from another Supabase project
  // is screened out here and falls through to the initial letter.
  if (isTrustedAvatarUrl(user.avatarUrl) && user.avatarUrl !== failedUrl) {
    const url = user.avatarUrl;
    return (
      <Image
        src={url}
        alt={alt}
        width={size}
        height={size}
        onError={() => setFailedUrl(url)}
        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
      />
    );
  }

  return <>{initial}</>;
}
