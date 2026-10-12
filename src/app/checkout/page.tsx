import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { CheckoutPage } from "@/components/checkout";
import { getPublicSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Checkout — PizzHub",
};

export default async function Checkout() {
  const settings = await getPublicSiteSettings();

  return (
    <>
      <Navbar />
      <main>
        <CheckoutPage initialSettings={settings} />
      </main>
      <Footer />
    </>
  );
}