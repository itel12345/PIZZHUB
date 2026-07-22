import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export const metadata: Metadata = {
  title: "Your Cart — PizzHub",
};

export default function Cart() {
  return (
    <>
      <Navbar />
      <main>
        <PlaceholderPage
          eyebrow="Cart"
          title="Your cart is waiting on you."
          description="Add a pizza from the menu and this page will hold it — full cart and checkout are coming next."
        />
      </main>
      <Footer />
    </>
  );
}