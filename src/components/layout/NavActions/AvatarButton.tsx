"use client";

import Link from "next/link";
import type { AuthUser } from "@/components/auth/types/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import styles from "./NavActions.module.css";

interface AvatarButtonProps {
  user: AuthUser;
}

export default function AvatarButton({ user }: AvatarButtonProps) {
  return (
    <Link
      href="/profile"
      className={styles.avatarButton}
      aria-label={`${user.name}'s profile`}
    >
      <UserAvatar user={user} size={80} />
    </Link>
  );
}