import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { CartPage } from "@/components/cart";
import { getPublicSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Your Cart — PizzHub",
};

export default async function Cart() {
  const settings = await getPublicSiteSettings();

  return (
    <>
      <Navbar />
      <main>
        <CartPage initialSettings={settings} />
      </main>
      <Footer />
    </>
  );
}