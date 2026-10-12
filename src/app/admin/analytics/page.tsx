import type { Metadata } from "next";
import { getAnalyticsForAdmin } from "@/lib/analytics";
import { AnalyticsPage } from "@/components/admin/analytics";

export const metadata: Metadata = {
  title: "Analytics — PizzHub Admin",
};

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsForAdmin();

  return <AnalyticsPage data={data} />;
}