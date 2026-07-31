import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { OrderSuccessPage } from "@/components/order-success";

export const metadata: Metadata = {
  title: "Order Confirmed — PizzHub",
};

export default function OrderSuccess() {
  return (
    <>
      <Navbar />
      <main>
        <OrderSuccessPage />
      </main>
      <Footer />
    </>
  );
}