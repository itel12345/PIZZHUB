// src/components/admin/customers/components/RoleBadge.tsx
//
// Same shared-badge pattern as Orders' OrderStatusBadge — one place
// mapping an enum value to its label/color, so a role can't render
// differently in two spots in this feature.

import type { Role } from "@/generated/prisma/client";
import styles from "./RoleBadge.module.css";

interface RoleBadgeProps {
  role: Role;
}

const LABELS: Record<Role, string> = {
  USER: "Customer",
  ADMIN: "Admin",
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[role.toLowerCase() as "user" | "admin"]}`}>
      {LABELS[role]}
    </span>
  );
}