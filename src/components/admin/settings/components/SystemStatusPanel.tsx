// src/components/admin/settings/components/SystemStatusPanel.tsx
//
// Read-only, no form, no client state needed — a plain server
// component, same as StatCard/RoleBadge elsewhere in this app.

import type { SystemStatusDTO } from "@/lib/settings";
import styles from "./SystemStatusPanel.module.css";

interface SystemStatusPanelProps {
  status: SystemStatusDTO;
}

interface StatusRow {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
}

export default function SystemStatusPanel({ status }: SystemStatusPanelProps) {
  const rows: StatusRow[] = [
    {
      label: "Database",
      ok: status.database === "connected",
      okText: "Connected",
      badText: "Connection error",
    },
    {
      label: "Paystack",
      ok: status.paystackConfigured,
      okText: "Configured",
      badText: "Not configured",
    },
    {
      label: "Cloudinary",
      ok: status.cloudinaryConfigured,
      okText: "Configured",
      badText: "Not configured",
    },
  ];

  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>System status</h2>

      <ul className={styles.list}>
        {rows.map((row) => (
          <li key={row.label} className={styles.row}>
            <span className={styles.label}>{row.label}</span>
            <span className={`${styles.badge} ${row.ok ? styles.ok : styles.bad}`}>
              <span className={styles.dot} />
              {row.ok ? row.okText : row.badText}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}