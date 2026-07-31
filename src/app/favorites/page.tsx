import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { FavoritesPage } from "@/components/favorites";

export const metadata: Metadata = {
  title: "Favorites — PizzHub",
};

export default function Favorites() {
  return (
    <>
      <Navbar />
      <main>
        <FavoritesPage />
      </main>
      <Footer />
    </>
  );
}