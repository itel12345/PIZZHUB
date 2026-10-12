import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderForAdmin } from "@/lib/orders";
import { OrderDetailPage } from "@/components/admin/orders";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdminOrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(0, 8)}… — PizzHub Admin` };
}

export default async function AdminOrderDetail({ params }: AdminOrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailPage order={order} />;
}
