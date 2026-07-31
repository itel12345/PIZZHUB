import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { CartPage } from "@/components/cart";

export const metadata: Metadata = {
  title: "Your Cart — PizzHub",
};

export default function Cart() {
  return (
    <>
      <Navbar />
      <main>
        <CartPage />
      </main>
      <Footer />
    </>
  );
}