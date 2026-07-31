"use client";

import Link from "next/link";
import type { AuthUser } from "@/components/auth/types/auth";
import styles from "./NavActions.module.css";

interface AvatarButtonProps {
  user: AuthUser;
}

export default function AvatarButton({ user }: AvatarButtonProps) {
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <Link
      href="/profile"
      className={styles.avatarButton}
      aria-label={`${user.name}'s profile`}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className={styles.avatarImage}
        />
      ) : (
        <span>{initial}</span>
      )}
    </Link>
  );
}