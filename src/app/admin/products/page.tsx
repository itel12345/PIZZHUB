import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { toPizzaDTO } from "@/lib/pizza";
import { ProductsPage } from "@/components/admin/products";
import { CATEGORY_OPTIONS } from "@/components/admin/products/types";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "Products — PizzHub Admin",
};

const PAGE_SIZE = 10;
const SORT_OPTIONS = ["newest", "oldest", "name-asc", "name-desc", "price-asc", "price-desc"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

function toSortOption(value: string | undefined): SortOption {
  return (SORT_OPTIONS as readonly string[]).includes(value ?? "")
    ? (value as SortOption)
    : "newest";
}

function toOrderBy(sort: SortOption): Prisma.PizzaOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { addedAt: "asc" };
    case "name-asc":
      return { name: "asc" };
    case "name-desc":
      return { name: "desc" };
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "newest":
    default:
      return { addedAt: "desc" };
  }
}

interface AdminProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;

  const rawPage = Number(params.page);
  // Upper bound isn't about legitimate use (no real catalog needs
  // 10,000 pages) — it's about not handing Prisma/Postgres an
  // attacker-controlled OFFSET with no ceiling. Without this, a
  // request like ?page=99999999999999999999 skips straight past
  // Number.isInteger's safety (that returns true for values built as
  // an integer literal even well past Number.MAX_SAFE_INTEGER) and
  // into an OFFSET large enough for Postgres to reject outright,
  // surfacing as a raw 500 instead of an empty, well-formed page.
  const MAX_PAGE = 10_000;
  const page =
    Number.isInteger(rawPage) && rawPage > 0
      ? Math.min(rawPage, MAX_PAGE)
      : 1;

  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const sort = toSortOption(typeof params.sort === "string" ? params.sort : undefined);

  const category =
    typeof params.category === "string" &&
    (CATEGORY_OPTIONS as readonly string[]).includes(params.category)
      ? params.category
      : undefined;

  const where: Prisma.PizzaWhereInput = {
    ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    ...(category ? { category } : {}),
  };

  // Single round trip for both the page of rows and the total count,
  // instead of two sequential awaits.
  const [pizzas, total] = await Promise.all([
    prisma.pizza.findMany({
      where,
      orderBy: toOrderBy(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.pizza.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <ProductsPage
      pizzas={pizzas.map(toPizzaDTO)}
      total={total}
      page={safePage}
      totalPages={totalPages}
      query={query}
      sort={sort}
      category={category}
    />
  );
}
