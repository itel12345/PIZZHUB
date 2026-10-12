import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { SettingsPage } from "@/components/profile";

export const metadata: Metadata = {
  title: "Settings — PizzHub",
};

export default function SettingsProfilePage() {
  return (
    <>
      <Navbar />
      <main>
        <SettingsPage />
      </main>
      <Footer />
    </>
  );
}
