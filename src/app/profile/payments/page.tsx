import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { PaymentMethodsPage } from "@/components/profile";

export const metadata: Metadata = {
  title: "Payment Methods — PizzHub",
};

export default function PaymentsProfilePage() {
  return (
    <>
      <Navbar />
      <main>
        <PaymentMethodsPage />
      </main>
      <Footer />
    </>
  );
}