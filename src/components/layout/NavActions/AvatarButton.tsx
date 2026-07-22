// src/components/layout/NavActions/AvatarButton.tsx
// Placeholder only, per the spec: structure it so a dropdown (Profile,
// Orders, Addresses, Settings, Logout) can be attached later without
// changing this button's markup or the space it occupies in the Navbar.

import type { AuthUser } from "./useAuthState";
import styles from "./NavActions.module.css";

interface AvatarButtonProps {
  user: AuthUser;
}

export default function AvatarButton({ user }: AvatarButtonProps) {
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <button
      type="button"
      className={styles.avatarButton}
      aria-label={`${user.name}'s account menu`}
      // TODO: onClick should open the account dropdown
      // (Profile / Orders / Addresses / Settings / Logout) once auth exists.
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className={styles.avatarImage} />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </button>
  );
}