import type { Metadata } from "next";
import { getOrdersForAdmin, type AdminOrderStatusFilter } from "@/lib/orders";
import { OrdersPage } from "@/components/admin/orders";

export const metadata: Metadata = {
  title: "Orders — PizzHub Admin",
};

const PAGE_SIZE = 10;
const STATUS_VALUES: AdminOrderStatusFilter[] = ["all", "pending", "confirmed", "cancelled"];

interface AdminOrdersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;

  const rawPage = Number(params.page);
  const MAX_PAGE = 10_000;
  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, MAX_PAGE) : 1;

  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";

  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const status: AdminOrderStatusFilter = STATUS_VALUES.includes(
    rawStatus as AdminOrderStatusFilter
  )
    ? (rawStatus as AdminOrderStatusFilter)
    : "all";

  const { orders, total } = await getOrdersForAdmin({ page, pageSize: PAGE_SIZE, status, query });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <OrdersPage
      orders={orders}
      total={total}
      page={safePage}
      totalPages={totalPages}
      query={query}
      status={status}
    />
  );
}
