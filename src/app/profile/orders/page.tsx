import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { OrderHistoryPage } from "@/components/profile";

export const metadata: Metadata = {
  title: "Order History — PizzHub",
};

export default function OrdersProfilePage() {
  return (
    <>
      <Navbar />
      <main>
        <OrderHistoryPage />
      </main>
      <Footer />
    </>
  );
}