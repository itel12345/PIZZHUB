import type { Metadata } from "next";
import { getCustomersForAdmin, type AdminCustomerRoleFilter } from "@/lib/customers";
import { CustomersPage } from "@/components/admin/customers";

export const metadata: Metadata = {
  title: "Customers — PizzHub Admin",
};

const PAGE_SIZE = 10;
const ROLE_VALUES: AdminCustomerRoleFilter[] = ["all", "user", "admin"];

interface AdminCustomersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const params = await searchParams;

  const rawPage = Number(params.page);
  const MAX_PAGE = 10_000;
  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, MAX_PAGE) : 1;

  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";

  const rawRole = typeof params.role === "string" ? params.role : "all";
  const role: AdminCustomerRoleFilter = ROLE_VALUES.includes(
    rawRole as AdminCustomerRoleFilter
  )
    ? (rawRole as AdminCustomerRoleFilter)
    : "all";

  const { customers, total } = await getCustomersForAdmin({
    page,
    pageSize: PAGE_SIZE,
    role,
    query,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <CustomersPage
      customers={customers}
      total={total}
      page={safePage}
      totalPages={totalPages}
      query={query}
      role={role}
    />
  );
}