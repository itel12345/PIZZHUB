// src/components/profile/components/ProfileHeader.tsx
//
// Top section of the Profile dashboard — large avatar, name, email,
// "Welcome back". Purely presentational; the page decides what user
// data to pass in, this component just lays it out.

import type { AuthUser } from "@/components/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import styles from "./ProfileHeader.module.css";

interface ProfileHeaderProps {
  user: AuthUser;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <section className={styles.header}>
      <div className={styles.avatar} aria-hidden="true">
        <UserAvatar user={user} size={176} />
      </div>

      <div className={styles.identity}>
        <span className={styles.welcome}>Welcome back</span>
        <h1 className={styles.name}>{user.name}</h1>
        {user.email && <p className={styles.email}>{user.email}</p>}
      </div>
    </section>
  );
}