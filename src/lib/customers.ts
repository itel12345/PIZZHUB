// src/lib/customers.ts
//
// Same DTO-and-single-source-of-computation discipline as lib/orders.ts
// and lib/cart.ts. Explicit `select` (never a bare findMany with no
// select) is deliberate here specifically: User.password lives right
// next to the fields this page actually needs, and an explicit
// allowlist is what makes "the password hash can never leak into this
// DTO" true by construction, not by remembering to strip it after the
// fact.
//
// "Total spent" and "orders" intentionally read from two different
// slices of the same relation: orderCount (_count.orders) counts every
// order the customer has ever placed regardless of outcome — that's
// "how much has this person interacted with checkout". totalSpent sums
// only CONFIRMED orders — a PENDING order that never completed, or one
// that was CANCELLED, was never actually paid, and admin-facing revenue
// figures must not count money that was never collected.

import "server-only";
import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";
import { Role } from "@/generated/prisma/client";

export type AdminCustomerRoleFilter = "all" | "user" | "admin";

const ROLE_FILTER_TO_ENUM: Record<Exclude<AdminCustomerRoleFilter, "all">, Role> = {
  user: Role.USER,
  admin: Role.ADMIN,
};

export interface AdminCustomerListItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  orderCount: number;
  totalSpent: number;
  favoriteCount: number;
}

interface GetCustomersForAdminParams {
  page: number;
  pageSize: number;
  role: AdminCustomerRoleFilter;
  /** Matches against name, email, or the user id itself — same
   * single-field "find this person" UX as the Orders search box. */
  query: string;
}

export async function getCustomersForAdmin({
  page,
  pageSize,
  role,
  query,
}: GetCustomersForAdminParams): Promise<{ customers: AdminCustomerListItem[]; total: number }> {
  const where: Prisma.UserWhereInput = {
    ...(role !== "all" ? { role: ROLE_FILTER_TO_ENUM[role] } : {}),
    ...(query
      ? {
          OR: [
            { id: query },
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true, favorites: true } },
        orders: {
          where: { status: "CONFIRMED" },
          select: { total: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const customers: AdminCustomerListItem[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    joinedAt: user.createdAt.toISOString(),
    orderCount: user._count.orders,
    // Rounded the same way Cart/Orders round money derived from a sum
    // of Floats (see lib/cart.ts's toCartSummaryDTO) — guards against
    // floating-point sums landing on e.g. 42.900000000000006.
    totalSpent: Math.round(user.orders.reduce((sum, order) => sum + order.total, 0) * 100) / 100,
    favoriteCount: user._count.favorites,
  }));

  return { customers, total };
}