import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getSiteSettings, getSystemStatus } from "@/lib/settings";
import { listAdmins } from "@/lib/admin-account";
import { SettingsPage } from "@/components/admin/settings";

export const metadata: Metadata = {
  title: "Settings — PizzHub Admin",
};

export default async function AdminSettingsPage() {
  // middleware.ts + admin/layout.tsx already guarantee an authenticated
  // admin session exists before this page renders — this call is not
  // re-doing that gate, it's reading the session's own userId/email,
  // which this specific page genuinely needs (to render "your
  // account" and to let the client know which admin row is "you", for
  // the self-lockout protection in AdminManagementPanel). The null
  // branch mirrors admin/layout.tsx's own fallback exactly, for the
  // structurally-unreachable case where it's ever missing anyway.
  const session = await getAdminSession();

  if (!session) {
    redirect("/?admin_auth_required=1");
  }

  const [settings, admins, systemStatus] = await Promise.all([
    getSiteSettings(),
    listAdmins(),
    getSystemStatus(),
  ]);

  return (
    <SettingsPage
      account={{ email: session.email, role: session.role }}
      currentAdminId={session.userId}
      settings={settings}
      admins={admins}
      systemStatus={systemStatus}
    />
  );
}