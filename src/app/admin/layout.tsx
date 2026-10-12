import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/layout";
import { getAdminSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin — PizzHub",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: middleware.ts already blocks unauthenticated
  // requests to /admin/* before they get this far. This check exists
  // so the admin section is still safe even if middleware's matcher
  // is ever changed or misconfigured for a specific route — a page
  // that verifies its own access doesn't depend on anything upstream
  // having done it correctly.
  const session = await getAdminSession();

  if (!session) {
    // No `redirect` param here (unlike middleware.ts denyAccess): this
    // branch is a safety net for the rare case middleware didn't run
    // or was misconfigured for this route — by definition we can't
    // rely on anything upstream, including a clean way to recover the
    // originally-requested path server-side here. The primary,
    // redirect-preserving path is middleware.ts, which runs first on
    // every request under the exact same matcher.
    redirect("/?admin_auth_required=1");
  }

  return <AdminShell>{children}</AdminShell>;
}
