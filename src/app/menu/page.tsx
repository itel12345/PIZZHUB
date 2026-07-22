import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { MenuPage } from "@/components/menu";
import { Footer } from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "Menu — PizzHub",
  description: "Browse fresh, wood-fired pizzas crafted daily and delivered across Ghana.",
};

export default function Menu() {
  return (
    <>
      <Navbar />
      <main>
        <MenuPage />
      </main>
      <Footer />
    </>
  );
}
