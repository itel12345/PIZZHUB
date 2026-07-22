import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export const metadata: Metadata = {
  title: "Favorites — PizzHub",
};

export default function Favorites() {
  return (
    <>
      <Navbar />
      <main>
        <PlaceholderPage
          eyebrow="Favorites"
          title="Nothing saved just yet."
          description="Tap the heart on any pizza in the menu to save it here. This page will list them once accounts are connected."
        />
      </main>
      <Footer />
    </>
  );
}