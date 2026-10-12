import { redirect } from "next/navigation";

// This file existed but was empty (0 bytes) — not a valid module, and
// Next.js requires every page.tsx to have a default export. Rather
// than fabricate a dashboard with placeholder stats/widgets that don't
// reflect anything real, this redirects to the one actual admin
// section that exists. When more admin sections are built, this
// becomes the natural place for a real landing page — not before.
export default function AdminIndexPage() {
  redirect("/admin/products");
}