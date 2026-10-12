// src/components/admin/settings/page/SettingsPage.tsx

import type { SiteSettingsDTO, SystemStatusDTO } from "@/lib/settings";
import type { AdminListItem } from "@/lib/admin-account";
import AccountPanel from "../components/AccountPanel";
import StoreSettingsPanel from "../components/StoreSettingsPanel";
import OrderSettingsPanel from "../components/OrderSettingsPanel";
import PaymentSettingsPanel from "../components/PaymentSettingsPanel";
import AdminManagementPanel from "../components/AdminManagementPanel";
import SystemStatusPanel from "../components/SystemStatusPanel";
import styles from "./SettingsPage.module.css";

interface SettingsPageProps {
  account: { email: string; role: string };
  currentAdminId: string;
  settings: SiteSettingsDTO;
  admins: AdminListItem[];
  systemStatus: SystemStatusDTO;
}

export default function SettingsPage({
  account,
  currentAdminId,
  settings,
  admins,
  systemStatus,
}: SettingsPageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Store configuration, admin access, and system status</p>
        </div>
      </div>

      <AccountPanel account={account} />
      <StoreSettingsPanel settings={settings} />
      <OrderSettingsPanel settings={settings} />
      <PaymentSettingsPanel settings={settings} />
      <AdminManagementPanel admins={admins} currentAdminId={currentAdminId} />
      <SystemStatusPanel status={systemStatus} />
    </div>
  );
}