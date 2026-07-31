import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { CheckoutPage } from "@/components/checkout";

export const metadata: Metadata = {
  title: "Checkout — PizzHub",
};

export default function Checkout() {
  return (
    <>
      <Navbar />
      <main>
        <CheckoutPage />
      </main>
      <Footer />
    </>
  );
}