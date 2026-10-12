import type { Metadata } from "next";
import { ProductFormPage } from "@/components/admin/products";

export const metadata: Metadata = {
  title: "Add Pizza — PizzHub Admin",
};

export default function NewProductPage() {
  return <ProductFormPage mode="create" />;
}